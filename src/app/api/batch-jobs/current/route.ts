import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
    createBatchAdminClient,
    enqueueBatchJobItem,
    getCurrentActiveBatchJob,
    getOrCreateActiveBatchJob,
    recoverStaleProcessing,
    toBatchJobPayload,
} from "@/lib/batch-jobs/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const job = await getCurrentActiveBatchJob(user.id);
        return NextResponse.json({ success: true, job });
    } catch (error) {
        console.error("[Batch Jobs Current API] GET Error:", error);
        return NextResponse.json({ error: "배치 큐를 불러오지 못했습니다." }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const material = typeof body.material === "string" ? body.material.trim() : "";
        const niche = typeof body.niche === "string" && body.niche ? body.niche : "knowledge";

        if (!material) {
            return NextResponse.json({ error: "소재를 입력해 주세요." }, { status: 400 });
        }

        const admin = createBatchAdminClient();
        let loaded = await getOrCreateActiveBatchJob(admin, user.id, niche);
        loaded = await recoverStaleProcessing(admin, loaded.job, loaded.items);

        const updated = await enqueueBatchJobItem(admin, loaded.job, loaded.items, user.id, material, niche);

        return NextResponse.json({
            success: true,
            job: toBatchJobPayload(updated.job, updated.items),
        });
    } catch (error) {
        console.error("[Batch Jobs Current API] POST Error:", error);
        const message = error instanceof Error ? error.message : "큐 추가에 실패했습니다.";
        const status = message.includes("최대") ? 400 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
