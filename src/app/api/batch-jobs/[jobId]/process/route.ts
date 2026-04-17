import { NextRequest, NextResponse } from "next/server";

import {
  type BatchJobItemRow,
  type BatchJobRow,
  createBatchAdminClient,
  loadBatchJobById,
  recoverStaleProcessing,
  toBatchJobPayload,
  updateBatchJobCounts,
} from "@/lib/batch-jobs/server";
import { deductUserCredits, refundUserCredits } from "@/lib/credits/server";
import { createClient } from "@/utils/supabase/server";

const RENDER_API_URL =
  process.env.SCRIPT_GENERATOR_API_URL || "https://script-generator-api-civ5.onrender.com";
const INTERNAL_PROCESS_KEY = process.env.API_SECRET_KEY || "";
const PROCESSABLE_JOB_STATUSES = ["draft", "running", "paused"];
const MAX_CREDIT_DEDUCT_RETRIES = 3;

type LoadedState = {
  job: BatchJobRow;
  items: BatchJobItemRow[];
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveBatchActor(
  request: NextRequest,
  jobId: string,
  admin: ReturnType<typeof createBatchAdminClient>,
): Promise<
  | { userId: string; loaded: LoadedState; internal: boolean }
  | { response: NextResponse }
> {
  const apiKey = request.headers.get("x-api-key");
  const isInternal = !!INTERNAL_PROCESS_KEY && apiKey === INTERNAL_PROCESS_KEY;

  if (isInternal) {
    const loaded = await loadBatchJobById(admin, null, jobId);
    if (!loaded) {
      return {
        response: NextResponse.json(
          { error: "배치 작업을 찾을 수 없습니다." },
          { status: 404 },
        ),
      };
    }

    return {
      userId: loaded.job.user_id,
      loaded,
      internal: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }

  const loaded = await loadBatchJobById(admin, user.id, jobId);
  if (!loaded) {
    return {
      response: NextResponse.json(
        { error: "배치 작업을 찾을 수 없습니다." },
        { status: 404 },
      ),
    };
  }

  return {
    userId: user.id,
    loaded,
    internal: false,
  };
}

async function reloadBatchState(
  admin: ReturnType<typeof createBatchAdminClient>,
  jobId: string,
): Promise<LoadedState> {
  const refreshed = await loadBatchJobById(admin, null, jobId);
  if (!refreshed) {
    throw new Error("배치 작업을 찾을 수 없습니다.");
  }

  return refreshed;
}

async function refundPendingErrors(
  admin: ReturnType<typeof createBatchAdminClient>,
  userId: string,
  state: LoadedState,
) {
  let refundedAny = false;

  for (const item of state.items) {
    if (
      item.status !== "error" ||
      item.credits_deducted <= 0 ||
      item.refund_processed_at
    ) {
      continue;
    }

    const refundRef = `batch_item_${item.id}_attempt_${item.attempt_count}`;
    const refund = await refundUserCredits(
      userId,
      item.credits_deducted,
      refundRef,
      item.error_code || "pipeline_error",
    );

    if (!refund.success) {
      continue;
    }

    refundedAny = true;
    await admin
      .from("batch_job_items")
      .update({
        credits_refunded: item.credits_deducted,
        refund_processed_at: new Date().toISOString(),
      })
      .eq("id", item.id);
  }

  return refundedAny;
}

async function deductBatchCreditsWithRetry(
  userId: string,
  jobId: string,
  itemId: string,
  attempt: number,
) {
  const referenceId = `batch_item_${itemId}_attempt_${attempt}`;

  for (let retry = 0; retry < MAX_CREDIT_DEDUCT_RETRIES; retry += 1) {
    const creditResult = await deductUserCredits(userId, "generate_batch", {
      referenceId,
      metadata: {
        jobId,
        itemId,
        attempt,
      },
    });

    if (creditResult.success || creditResult.status !== 409) {
      return { creditResult, referenceId };
    }

    await sleep(200 * (retry + 1));
  }

  const creditResult = await deductUserCredits(userId, "generate_batch", {
    referenceId,
    metadata: {
      jobId,
      itemId,
      attempt,
    },
  });

  return { creditResult, referenceId };
}

async function acquireJobLock(
  admin: ReturnType<typeof createBatchAdminClient>,
  state: LoadedState,
  nextItemId: string,
  startedAt: string,
) {
  const { data, error } = await admin
    .from("batch_jobs")
    .update({
      status: "running",
      current_item_id: nextItemId,
      started_at: state.job.started_at ?? startedAt,
      finished_at: null,
      last_error: null,
      updated_at: startedAt,
    })
    .eq("id", state.job.id)
    .is("current_item_id", null)
    .in("status", PROCESSABLE_JOB_STATUSES)
    .select("id");

  if (error) {
    throw error;
  }

  return (data || []).length > 0;
}

async function markItemProcessing(
  admin: ReturnType<typeof createBatchAdminClient>,
  itemId: string,
  attempt: number,
  creditsDeducted: number,
  startedAt: string,
) {
  const { data, error } = await admin
    .from("batch_job_items")
    .update({
      status: "processing",
      phase: "analyzing",
      credits_deducted: creditsDeducted,
      credits_refunded: 0,
      refund_processed_at: null,
      attempt_count: attempt,
      started_at: startedAt,
      finished_at: null,
      updated_at: startedAt,
      error: null,
      error_code: null,
    })
    .eq("id", itemId)
    .eq("status", "queued")
    .select("id");

  if (error) {
    throw error;
  }

  return (data || []).length > 0;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await context.params;
    const admin = createBatchAdminClient();
    const actor = await resolveBatchActor(request, jobId, admin);

    if ("response" in actor) {
      return actor.response;
    }

    let state = await recoverStaleProcessing(
      admin,
      actor.loaded.job,
      actor.loaded.items,
    );

    for (let loop = 0; loop < Math.max(2, state.items.length + 2); loop += 1) {
      const processingItem = state.items.find((item) => item.status === "processing");
      if (processingItem) {
        return NextResponse.json({
          success: true,
          job: toBatchJobPayload(state.job, state.items),
          busy: true,
        });
      }

      const refundedAny = await refundPendingErrors(admin, actor.userId, state);
      if (refundedAny) {
        state = await updateBatchJobCounts(admin, state.job.id, {
          current_item_id: null,
        });
      }

      const nextItem = state.items.find((item) => item.status === "queued");
      if (!nextItem) {
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

      const startedAt = new Date().toISOString();
      const lockAcquired = await acquireJobLock(admin, state, nextItem.id, startedAt);
      if (!lockAcquired) {
        const refreshed = await reloadBatchState(admin, state.job.id);
        state = await recoverStaleProcessing(admin, refreshed.job, refreshed.items);

        return NextResponse.json({
          success: true,
          job: toBatchJobPayload(state.job, state.items),
          busy: true,
        });
      }

      const newAttempt = (nextItem.attempt_count || 0) + 1;
      const { creditResult, referenceId } = await deductBatchCreditsWithRetry(
        actor.userId,
        state.job.id,
        nextItem.id,
        newAttempt,
      );

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

      const claimed = await markItemProcessing(
        admin,
        nextItem.id,
        newAttempt,
        creditResult.deducted,
        startedAt,
      );

      if (!claimed) {
        const refundResult = await refundUserCredits(
          actor.userId,
          creditResult.deducted,
          referenceId,
          "claim_failed",
        );

        if (refundResult.success) {
          await admin
            .from("batch_job_items")
            .update({
              credits_refunded: creditResult.deducted,
              refund_processed_at: new Date().toISOString(),
            })
            .eq("id", nextItem.id);
        }

        state = await updateBatchJobCounts(admin, state.job.id, {
          current_item_id: null,
          last_error: "다음 배치 항목을 확보하지 못했습니다. 다시 시도해 주세요.",
        });
        continue;
      }

      state = await updateBatchJobCounts(admin, state.job.id, {
        status: "running",
        current_item_id: nextItem.id,
        started_at: state.job.started_at ?? startedAt,
        finished_at: null,
        last_error: null,
      });

      const handoffController = new AbortController();
      const handoffTimeout = setTimeout(() => handoffController.abort(), 60000);
      let handoffOk = false;

      try {
        const renderRes = await fetch(`${RENDER_API_URL}/api/v2/batch-process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.API_SECRET_KEY && {
              "X-Api-Key": process.env.API_SECRET_KEY,
            }),
          },
          body: JSON.stringify({
            material: nextItem.material,
            niche: nextItem.niche || state.job.niche,
            tone: "",
            job_id: state.job.id,
            item_id: nextItem.id,
            user_id: `${actor.userId}_batch_${nextItem.id}`,
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

        const failedAt = new Date().toISOString();
        const errMsg =
          error instanceof Error ? error.message : "Render 서버 연결 실패";
        const errorCode = errMsg.includes("abort")
          ? "handoff_timeout"
          : "handoff_failed";

        const refundResult = await refundUserCredits(
          actor.userId,
          creditResult.deducted,
          referenceId,
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

        state = await updateBatchJobCounts(admin, state.job.id, {
          current_item_id: null,
          last_error: errMsg,
        });
        continue;
      }

      return NextResponse.json({
        success: true,
        credits: creditResult.credits,
        job: toBatchJobPayload(state.job, state.items),
      });
    }

    const exhausted = await updateBatchJobCounts(admin, state.job.id, {
      status: "paused",
      current_item_id: null,
      last_error: "배치 처리 루프가 비정상적으로 반복되어 일시 중지했습니다.",
    });

    return NextResponse.json(
      {
        success: false,
        error: exhausted.job.last_error,
        job: toBatchJobPayload(exhausted.job, exhausted.items),
      },
      { status: 409 },
    );
  } catch (error) {
    console.error("[Batch Job Process API] Error:", error);
    return NextResponse.json(
      { error: "배치 작업 처리에 실패했습니다." },
      { status: 500 },
    );
  }
}
