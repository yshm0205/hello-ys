import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createBatchAdminClient, updateBatchJobCounts, toBatchJobPayload } from "@/lib/batch-jobs/server";
import { refundUserCredits } from "@/lib/credits/server";

export async function POST(
    _request: Request,
    context: { params: Promise<{ itemId: string }> },
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { itemId } = await context.params;
        const admin = createBatchAdminClient();

        // 아이템 조회 (환불 상태 포함)
        const { data: item } = await admin
            .from("batch_job_items")
            .select("id, job_id, user_id, status, credits_deducted, refund_processed_at, attempt_count, error_code, sort_order")
            .eq("id", itemId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (!item) {
            return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
        }

        if (item.status !== "error") {
            return NextResponse.json({ error: "실패한 항목만 재시도할 수 있습니다." }, { status: 409 });
        }

        // 미환불 상태면 환불 먼저 처리
        if (item.credits_deducted > 0 && !item.refund_processed_at) {
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
            } else {
                // 환불 실패 → retry 차단, error 상태 유지
                return NextResponse.json(
                    { error: "이전 실패 건의 환불 처리에 실패했습니다. 잠시 후 다시 시도해 주세요." },
                    { status: 409 },
                );
            }
        }

        // 현재 queued 중 가장 작은 sort_order 찾아서 그 앞으로 배치
        const { data: allItems } = await admin
            .from("batch_job_items")
            .select("sort_order")
            .eq("job_id", item.job_id)
            .eq("status", "queued")
            .order("sort_order", { ascending: true })
            .limit(1);

        const minOrder = allItems && allItems.length > 0 ? allItems[0].sort_order - 1 : item.sort_order;

        // error → queued로 전환 (sort_order를 맨 앞으로)
        const now = new Date().toISOString();
        await admin
            .from("batch_job_items")
            .update({
                status: "queued",
                phase: null,
                error: null,
                error_code: null,
                credits_deducted: 0,
                credits_refunded: 0,
                refund_processed_at: null,
                sort_order: minOrder,
                started_at: null,
                finished_at: null,
                updated_at: now,
            })
            .eq("id", itemId);

        // job 상태를 running으로 (paused였으면 해제)
        const updated = await updateBatchJobCounts(admin, item.job_id, {
            status: "running",
            finished_at: null,
            last_error: null,
        });

        return NextResponse.json({
            success: true,
            job: toBatchJobPayload(updated.job, updated.items),
        });
    } catch (error) {
        console.error("[Batch Job Item Retry API] Error:", error);
        return NextResponse.json({ error: "재시도에 실패했습니다." }, { status: 500 });
    }
}
