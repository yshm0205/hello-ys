import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createBatchAdminClient } from "@/lib/batch-jobs/server";

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
        const now = new Date().toISOString();

        // queued → cancelled
        await admin
            .from("batch_job_items")
            .update({ status: "cancelled", updated_at: now })
            .eq("job_id", jobId)
            .eq("user_id", user.id)
            .eq("status", "queued");

        // processing → error (Render 백그라운드가 나중에 덮어쓸 수 있지만 안전장치)
        await admin
            .from("batch_job_items")
            .update({ status: "error", phase: null, error: "사용자가 배치를 초기화했습니다.", updated_at: now, finished_at: now })
            .eq("job_id", jobId)
            .eq("user_id", user.id)
            .eq("status", "processing");

        // 카운트 재계산
        const { data: items } = await admin
            .from("batch_job_items")
            .select("status")
            .eq("job_id", jobId);

        const counts = { queued: 0, processing: 0, done: 0, error: 0 };
        for (const it of items || []) {
            const st = it.status as keyof typeof counts;
            if (st in counts) counts[st]++;
        }

        // job을 completed로 닫기
        const { error } = await admin
            .from("batch_jobs")
            .update({
                status: "completed",
                current_item_id: null,
                finished_at: now,
                updated_at: now,
                total_count: counts.done + counts.error,
                queued_count: 0,
                processing_count: 0,
                done_count: counts.done,
                error_count: counts.error,
            })
            .eq("id", jobId)
            .eq("user_id", user.id)
            .in("status", ["draft", "running", "paused"]);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Batch Job Reset API] Error:", error);
        return NextResponse.json({ error: "배치 작업 초기화에 실패했습니다." }, { status: 500 });
    }
}
