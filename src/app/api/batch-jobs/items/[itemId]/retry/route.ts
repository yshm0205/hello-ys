import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createBatchAdminClient, updateBatchJobCounts, toBatchJobPayload } from "@/lib/batch-jobs/server";

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

        // 아이템 조회
        const { data: item } = await admin
            .from("batch_job_items")
            .select("id, job_id, user_id, status")
            .eq("id", itemId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (!item) {
            return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
        }

        if (item.status !== "error") {
            return NextResponse.json({ error: "실패한 항목만 재시도할 수 있습니다." }, { status: 409 });
        }

        // error → queued로 전환 (환불 기록은 유지, 새 차감은 processing 시작 때)
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
