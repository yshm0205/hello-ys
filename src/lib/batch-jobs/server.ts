import { createAdminClient } from "@/utils/supabase/admin";

export const MAX_BATCH_ITEMS = 10;
export const BATCH_PROCESSING_STALE_MS = 10 * 60 * 1000;

export type BatchJobStatus = "draft" | "running" | "paused" | "completed" | "failed";
export type BatchJobItemStatus = "queued" | "processing" | "done" | "error" | "cancelled";
export type BatchJobPhase = "analyzing" | "generating" | "reviewing" | null;

export interface BatchJobRow {
    id: string;
    user_id: string;
    niche: string;
    status: BatchJobStatus;
    current_item_id: string | null;
    last_error: string | null;
    total_count: number;
    queued_count: number;
    processing_count: number;
    done_count: number;
    error_count: number;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface BatchJobItemRow {
    id: string;
    job_id: string;
    user_id: string;
    sort_order: number;
    material: string;
    status: BatchJobItemStatus;
    phase: BatchJobPhase;
    scripts: Array<{ hook: string; full_script: string }> | null;
    niche: string;
    error: string | null;
    error_code: string | null;
    elapsed: number | null;
    credits_deducted: number;
    credits_refunded: number;
    refund_processed_at: string | null;
    attempt_count: number;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface BatchJobPayload {
    id: string;
    niche: string;
    status: BatchJobStatus;
    lastError: string | null;
    totalCount: number;
    queuedCount: number;
    processingCount: number;
    doneCount: number;
    errorCount: number;
    startedAt: string | null;
    finishedAt: string | null;
    items: BatchJobItemPayload[];
}

export interface BatchJobItemPayload {
    id: string;
    material: string;
    status: BatchJobItemStatus;
    phase: BatchJobPhase;
    scripts: Array<{ hook: string; full_script: string }> | null;
    niche: string;
    error: string | null;
    errorCode: string | null;
    elapsed: number | null;
    creditsRefunded: number;
    sortOrder: number;
    startedAt: string | null;
    finishedAt: string | null;
}

const ACTIVE_JOB_STATUSES: BatchJobStatus[] = ["draft", "running", "paused", "completed"];

export function createBatchAdminClient() {
    return createAdminClient();
}

export async function getCurrentActiveBatchJob(userId: string): Promise<BatchJobPayload | null> {
    const admin = createBatchAdminClient();
    const loaded = await loadActiveBatchJob(admin, userId);
    if (!loaded) return null;
    const recovered = await recoverStaleProcessing(admin, loaded.job, loaded.items);
    return toBatchJobPayload(recovered.job, recovered.items);
}

export async function loadActiveBatchJob(
    admin: ReturnType<typeof createAdminClient>,
    userId: string,
): Promise<{ job: BatchJobRow; items: BatchJobItemRow[] } | null> {
    const { data: job } = await admin
        .from("batch_jobs")
        .select("*")
        .eq("user_id", userId)
        .in("status", ACTIVE_JOB_STATUSES)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!job) return null;

    // completed job은 1시간 지나면 자동 만료 (다음 방문 시 깨끗한 상태)
    if (job.status === "completed" && job.finished_at) {
        const elapsed = Date.now() - new Date(job.finished_at).getTime();
        if (elapsed > 60 * 60 * 1000) {
            return null;
        }
    }

    const { data: items, error } = await admin
        .from("batch_job_items")
        .select("*")
        .eq("job_id", job.id)
        .order("sort_order", { ascending: true });

    if (error) {
        throw error;
    }

    return {
        job: job as BatchJobRow,
        items: (items ?? []) as BatchJobItemRow[],
    };
}

export async function loadBatchJobById(
    admin: ReturnType<typeof createAdminClient>,
    userId: string | null,
    jobId: string,
): Promise<{ job: BatchJobRow; items: BatchJobItemRow[] } | null> {
    let query = admin
        .from("batch_jobs")
        .select("*")
        .eq("id", jobId);

    if (userId) {
        query = query.eq("user_id", userId);
    }

    const { data: job } = await query.maybeSingle();

    if (!job) return null;

    const { data: items, error } = await admin
        .from("batch_job_items")
        .select("*")
        .eq("job_id", jobId)
        .order("sort_order", { ascending: true });

    if (error) {
        throw error;
    }

    return {
        job: job as BatchJobRow,
        items: (items ?? []) as BatchJobItemRow[],
    };
}

export async function getOrCreateActiveBatchJob(
    admin: ReturnType<typeof createAdminClient>,
    userId: string,
    niche: string,
): Promise<{ job: BatchJobRow; items: BatchJobItemRow[] }> {
    const existing = await loadActiveBatchJob(admin, userId);
    if (existing) {
        // completed job은 재사용하지 않고 새 job 생성 (데이터는 그대로 유지)
        if (existing.job.status === "completed") {
            // completed 상태 유지, finished_at을 과거로 밀어서 active 조회에서 제외
            await admin
                .from("batch_jobs")
                .update({ finished_at: new Date(0).toISOString(), updated_at: new Date().toISOString() })
                .eq("id", existing.job.id);
            // 아래로 빠져서 새 job 생성
        } else {
            return existing;
        }
    }

    const now = new Date().toISOString();
    const { data: job, error } = await admin
        .from("batch_jobs")
        .insert({
            user_id: userId,
            niche,
            status: "draft",
            created_at: now,
            updated_at: now,
        })
        .select("*")
        .single();

    if (error || !job) {
        throw error ?? new Error("배치 작업 생성에 실패했습니다.");
    }

    return {
        job: job as BatchJobRow,
        items: [],
    };
}

export async function enqueueBatchJobItem(
    admin: ReturnType<typeof createAdminClient>,
    job: BatchJobRow,
    items: BatchJobItemRow[],
    userId: string,
    material: string,
    niche: string = "knowledge",
): Promise<{ job: BatchJobRow; items: BatchJobItemRow[] }> {
    // done/cancelled 제외한 활성 슬롯만 카운트 (완료된 건 슬롯 차지 안 함)
    const activeCount = items.filter((item) => item.status !== "cancelled" && item.status !== "done").length;

    if (activeCount >= MAX_BATCH_ITEMS) {
        throw new Error(`큐는 최대 ${MAX_BATCH_ITEMS}개까지 담을 수 있습니다.`);
    }

    const nextOrder = items.length > 0 ? Math.max(...items.map((item) => item.sort_order)) + 1 : 1;
    const now = new Date().toISOString();

    const { error } = await admin.from("batch_job_items").insert({
        job_id: job.id,
        user_id: userId,
        sort_order: nextOrder,
        material,
        niche,
        status: "queued",
        created_at: now,
        updated_at: now,
    });

    if (error) {
        throw error;
    }

    return updateBatchJobCounts(admin, job.id);
}

export async function removeBatchJobItem(
    admin: ReturnType<typeof createAdminClient>,
    userId: string,
    itemId: string,
): Promise<{ job: BatchJobRow | null; items: BatchJobItemRow[] }> {
    const { data: item } = await admin
        .from("batch_job_items")
        .select("id, job_id, user_id, status")
        .eq("id", itemId)
        .eq("user_id", userId)
        .maybeSingle();

    if (!item) {
        throw new Error("삭제할 항목을 찾을 수 없습니다.");
    }

    if (item.status === "processing") {
        throw new Error("현재 처리 중인 항목은 삭제할 수 없습니다.");
    }

    const { error } = await admin.from("batch_job_items").delete().eq("id", itemId);
    if (error) {
        throw error;
    }

    const updated = await updateBatchJobCounts(admin, item.job_id);

    if (updated.items.length === 0 && updated.job.status !== "running") {
        await admin.from("batch_jobs").delete().eq("id", item.job_id);
        return { job: null, items: [] };
    }

    return updated;
}

export async function recoverStaleProcessing(
    admin: ReturnType<typeof createAdminClient>,
    job: BatchJobRow,
    items: BatchJobItemRow[],
): Promise<{ job: BatchJobRow; items: BatchJobItemRow[] }> {
    const now = Date.now();
    const staleIds = items
        .filter((item) => item.status === "processing" && item.started_at)
        .filter((item) => now - new Date(item.started_at as string).getTime() > BATCH_PROCESSING_STALE_MS)
        .map((item) => item.id);

    if (staleIds.length === 0) {
        return { job, items };
    }

    const timestamp = new Date().toISOString();

    await admin
        .from("batch_job_items")
        .update({
            status: "queued",
            phase: null,
            started_at: null,
            updated_at: timestamp,
            error: "중단된 작업을 자동 복구했습니다. 다시 시작해 주세요.",
        })
        .in("id", staleIds);

    await admin
        .from("batch_jobs")
        .update({
            status: "paused",
            current_item_id: null,
            last_error: "새로고침 또는 연결 끊김으로 중단된 작업을 복구했습니다.",
            updated_at: timestamp,
        })
        .eq("id", job.id);

    return updateBatchJobCounts(admin, job.id);
}

export async function updateBatchJobCounts(
    admin: ReturnType<typeof createAdminClient>,
    jobId: string,
    overrides?: Partial<BatchJobRow>,
): Promise<{ job: BatchJobRow; items: BatchJobItemRow[] }> {
    const loaded = await loadBatchJobById(admin, null, jobId);

    if (!loaded) {
        throw new Error("배치 작업을 찾을 수 없습니다.");
    }

    const { job, items } = loaded;
    const activeItems = items.filter((item) => item.status !== "cancelled");
    const queuedCount = activeItems.filter((item) => item.status === "queued").length;
    const processingCount = activeItems.filter((item) => item.status === "processing").length;
    const doneCount = activeItems.filter((item) => item.status === "done").length;
    const errorCount = activeItems.filter((item) => item.status === "error").length;
    const totalCount = activeItems.length;

    const update: Partial<BatchJobRow> = {
        total_count: totalCount,
        queued_count: queuedCount,
        processing_count: processingCount,
        done_count: doneCount,
        error_count: errorCount,
        updated_at: new Date().toISOString(),
        ...overrides,
    };

    const { data: updatedJob, error } = await admin
        .from("batch_jobs")
        .update(update)
        .eq("id", job.id)
        .select("*")
        .single();

    if (error || !updatedJob) {
        throw error ?? new Error("배치 작업 집계 갱신에 실패했습니다.");
    }

    return {
        job: updatedJob as BatchJobRow,
        items,
    };
}

export function toBatchJobPayload(job: BatchJobRow, items: BatchJobItemRow[]): BatchJobPayload {
    return {
        id: job.id,
        niche: job.niche,
        status: job.status,
        lastError: job.last_error,
        totalCount: job.total_count,
        queuedCount: job.queued_count,
        processingCount: job.processing_count,
        doneCount: job.done_count,
        errorCount: job.error_count,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        items: items.map((item) => ({
            id: item.id,
            material: item.material,
            niche: item.niche,
            status: item.status,
            phase: item.phase,
            scripts: item.scripts,
            error: item.error,
            errorCode: item.error_code,
            elapsed: item.elapsed,
            creditsRefunded: item.credits_refunded,
            sortOrder: item.sort_order,
            startedAt: item.started_at,
            finishedAt: item.finished_at,
        })),
    };
}
