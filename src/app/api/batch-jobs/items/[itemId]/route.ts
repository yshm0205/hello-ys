import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createBatchAdminClient, removeBatchJobItem, toBatchJobPayload } from "@/lib/batch-jobs/server";

export async function DELETE(
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
        const result = await removeBatchJobItem(admin, user.id, itemId);

        return NextResponse.json({
            success: true,
            job: result.job ? toBatchJobPayload(result.job, result.items) : null,
        });
    } catch (error) {
        console.error("[Batch Job Item API] DELETE Error:", error);
        const message = error instanceof Error ? error.message : "큐 항목 삭제에 실패했습니다.";
        const status = message.includes("삭제할 항목") ? 404 : message.includes("처리 중") ? 409 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
