import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createBatchAdminClient, loadBatchJobById, recoverStaleProcessing, toBatchJobPayload, updateBatchJobCounts } from "@/lib/batch-jobs/server";
import { deductUserCredits, refundUserCredits } from "@/lib/credits/server";

const RENDER_API_URL = process.env.SCRIPT_GENERATOR_API_URL || "https://script-generator-api-civ5.onrender.com";

export async function POST(
    _request: Request,
    context: { params: Promise<{ jobId: string }> },
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { jobId } = await context.params;
        const admin = createBatchAdminClient();
        const loaded = await loadBatchJobById(admin, user.id, jobId);

        if (!loaded) {
            return NextResponse.json({ error: "배치 작업을 찾을 수 없습니다." }, { status: 404 });
        }

        let state = await recoverStaleProcessing(admin, loaded.job, loaded.items);

        // 이미 처리 중인 아이템이 있으면 대기
        const processingItem = state.items.find((item) => item.status === "processing");
        if (processingItem) {
            return NextResponse.json({
                success: true,
                job: toBatchJobPayload(state.job, state.items),
                busy: true,
            });
        }

        // 환불 안 된 에러 아이템 처리 (Render 파이프라인 에러 시)
        for (const item of state.items) {
            if (
                item.status === "error" &&
                item.credits_deducted > 0 &&
                !item.refund_processed_at
            ) {
                const refundRef = `batch_item_${item.id}_attempt_${item.attempt_count}`;
                const refund = await refundUserCredits(
                    user.id,
                    item.credits_deducted,
                    refundRef,
                    item.error_code || "pipeline_error",
                );
                if (refund.success) {
                    await admin
                        .from("batch_job_items")
                        .update({
                            credits_refunded: item.credits_deducted,
                            refund_processed_at: new Date().toISOString(),
                        })
                        .eq("id", item.id);
                }
            }
        }

        // 다음 queued 아이템 찾기
        const nextItem = state.items.find((item) => item.status === "queued");
        if (!nextItem) {
            // error 아이템이 남아있으면 paused (재시도 가능하도록), 없으면 completed
            const hasErrors = state.items.some((item) => item.status === "error");
            const finalStatus = hasErrors ? "paused" : "completed";
            const finished = await updateBatchJobCounts(admin, state.job.id, {
                status: finalStatus,
                current_item_id: null,
                finished_at: new Date().toISOString(),
                last_error: hasErrors ? "일부 항목이 실패했습니다. 재시도할 수 있습니다." : null,
            });
            return NextResponse.json({
                success: true,
                job: toBatchJobPayload(finished.job, finished.items),
            });
        }

        // 크레딧 차감
        const creditResult = await deductUserCredits(user.id, "generate_batch");
        if (!creditResult.success) {
            const paused = await updateBatchJobCounts(admin, state.job.id, {
                status: "paused",
                current_item_id: null,
                last_error: creditResult.error,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: creditResult.error,
                    credits: creditResult.credits,
                    job: toBatchJobPayload(paused.job, paused.items),
                },
                { status: creditResult.status },
            );
        }

        // DB: 아이템을 processing으로 마킹 + attempt_count 증가
        const startedAt = new Date().toISOString();
        const newAttempt = (nextItem.attempt_count || 0) + 1;
        await admin
            .from("batch_job_items")
            .update({
                status: "processing",
                phase: "analyzing",
                credits_deducted: creditResult.deducted,
                credits_refunded: 0,
                refund_processed_at: null,
                attempt_count: newAttempt,
                started_at: startedAt,
                updated_at: startedAt,
                error: null,
                error_code: null,
            })
            .eq("id", nextItem.id);

        state = await updateBatchJobCounts(admin, state.job.id, {
            status: "running",
            current_item_id: nextItem.id,
            started_at: state.job.started_at ?? startedAt,
            finished_at: null,
            last_error: null,
        });

        // Render에 비동기 처리 요청 (handoff timeout 60초 — cold start 대비)
        const handoffController = new AbortController();
        const handoffTimeout = setTimeout(() => handoffController.abort(), 60000);
        let handoffOk = false;

        try {
            const renderRes = await fetch(`${RENDER_API_URL}/api/v2/batch-process`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(process.env.API_SECRET_KEY && { "X-Api-Key": process.env.API_SECRET_KEY }),
                },
                body: JSON.stringify({
                    material: nextItem.material,
                    niche: state.job.niche,
                    tone: "",
                    job_id: state.job.id,
                    item_id: nextItem.id,
                    user_id: `${user.id}_batch_${nextItem.id}`,
                }),
                signal: handoffController.signal,
            });
            clearTimeout(handoffTimeout);

            if (renderRes.ok) {
                const body = await renderRes.json().catch(() => ({}));
                handoffOk = !!body.accepted;
            }

            if (!handoffOk) {
                throw new Error(`Render handoff 실패 (${renderRes.status})`);
            }
        } catch (error) {
            clearTimeout(handoffTimeout);
            // Render 연결/응답 실패 → 아이템 에러 처리 + 크레딧 환불
            const failedAt = new Date().toISOString();
            const errMsg = error instanceof Error ? error.message : "Render 서버 연결 실패";
            const errorCode = errMsg.includes("abort") ? "handoff_timeout" : "handoff_failed";

            // 크레딧 환불
            const refundResult = await refundUserCredits(
                user.id,
                creditResult.deducted,
                `batch_item_${nextItem.id}_attempt_${newAttempt}`,
                errorCode,
            );

            await admin
                .from("batch_job_items")
                .update({
                    status: "error",
                    phase: null,
                    updated_at: failedAt,
                    finished_at: failedAt,
                    error: errMsg,
                    error_code: errorCode,
                    credits_refunded: refundResult.success ? creditResult.deducted : 0,
                    refund_processed_at: refundResult.success ? failedAt : null,
                })
                .eq("id", nextItem.id);

            const errored = await updateBatchJobCounts(admin, state.job.id, {
                current_item_id: null,
                last_error: errMsg,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: errMsg,
                    credits: refundResult.credits ?? creditResult.credits,
                    job: toBatchJobPayload(errored.job, errored.items),
                },
                { status: 500 },
            );
        }

        // 즉시 반환 — Render가 백그라운드에서 처리 후 Supabase 직접 업데이트
        return NextResponse.json({
            success: true,
            credits: creditResult.credits,
            job: toBatchJobPayload(state.job, state.items),
        });
    } catch (error) {
        console.error("[Batch Job Process API] Error:", error);
        return NextResponse.json({ error: "배치 작업 처리에 실패했습니다." }, { status: 500 });
    }
}
