import { NextRequest, NextResponse } from "next/server";

import { getPublishedLectureVideoByVodId } from "@/lib/lectures/server";
import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const COMPLETION_THRESHOLD = 0.9;
const MAX_INITIAL_PROGRESS_SECONDS = 45;
const MAX_HEARTBEAT_PROGRESS_SECONDS = 60;
const HEARTBEAT_GRACE_SECONDS = 20;
const PLAYBACK_RATE_TOLERANCE = 1.5;

type ProgressRow = {
  last_position: number | null;
  completed_at: string | null;
  watched_seconds?: number | null;
  last_progress_at?: string | null;
};

function getProgressPercent(positionSeconds: number, durationSeconds: number) {
  if (durationSeconds <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((positionSeconds / durationSeconds) * 100)));
}

function clampPosition(value: unknown, durationSeconds: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const rounded = Math.round(value);
  if (durationSeconds > 0) {
    return Math.min(Math.max(0, rounded), durationSeconds);
  }

  return Math.max(0, rounded);
}

function getAllowedProgressIncrement(lastProgressAt: string | null | undefined, now: Date) {
  if (!lastProgressAt) return MAX_INITIAL_PROGRESS_SECONDS;

  const lastTime = new Date(lastProgressAt).getTime();
  if (!Number.isFinite(lastTime)) return HEARTBEAT_GRACE_SECONDS;

  const elapsedSeconds = Math.max(0, (now.getTime() - lastTime) / 1000);
  const allowedByElapsed = Math.ceil(elapsedSeconds * PLAYBACK_RATE_TOLERANCE + HEARTBEAT_GRACE_SECONDS);

  return Math.min(MAX_HEARTBEAT_PROGRESS_SECONDS, Math.max(0, allowedByElapsed));
}

async function loadProgressRow(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  vodId: string,
) {
  const withAudit = await db
    .from("lecture_progress")
    .select("last_position, completed_at, watched_seconds, last_progress_at")
    .eq("user_id", userId)
    .eq("vod_id", vodId)
    .limit(1);

  if (!withAudit.error) {
    return {
      row: (withAudit.data?.[0] || null) as ProgressRow | null,
      supportsAuditColumns: true,
    };
  }

  const fallback = await db
    .from("lecture_progress")
    .select("last_position, completed_at")
    .eq("user_id", userId)
    .eq("vod_id", vodId)
    .limit(1);

  if (fallback.error) {
    throw fallback.error;
  }

  return {
    row: (fallback.data?.[0] || null) as ProgressRow | null,
    supportsAuditColumns: false,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data, error } = await supabase
      .from("lecture_progress")
      .select("vod_id, completed_at, last_position")
      .eq("user_id", user.id);
    if (error) {
      console.error("[Lectures API] DB Error:", error);
      return NextResponse.json({ success: true, completedVods: [], positions: {} });
    }
    const completedVods: string[] = [];
    const positions: Record<string, number> = {};
    for (const row of data || []) {
      if (row.completed_at) {
        completedVods.push(row.vod_id);
      }
      if (row.last_position && row.last_position > 0) {
        positions[row.vod_id] = row.last_position;
      }
    }
    return NextResponse.json({ success: true, completedVods, positions });
  } catch (err) {
    console.error("[Lectures API] GET Error:", err);
    return NextResponse.json({ success: true, completedVods: [], positions: {} });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getEffectiveCreditInfo(user.id);
    if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
      return NextResponse.json(
        { error: "Lecture progress requires an active program." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const vodId = body.vod_id;
    if (!vodId || typeof vodId !== "string") {
      return NextResponse.json({ error: "vod_id required" }, { status: 400 });
    }
    if (!/^vod_\d{2}$/.test(vodId)) {
      return NextResponse.json({ error: "Invalid vod_id" }, { status: 400 });
    }

    const lectureVideo = await getPublishedLectureVideoByVodId(vodId);
    if (!lectureVideo) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const durationSeconds = Math.max(0, Math.round((lectureVideo.durationMinutes || 0) * 60));
    const requestedPosition = clampPosition(body.last_position, durationSeconds);

    const admin = createAdminClient();
    let progressState: Awaited<ReturnType<typeof loadProgressRow>>;
    try {
      progressState = await loadProgressRow(admin, user.id, vodId);
    } catch (error) {
      console.error("[Lectures API] Progress load error:", error);
      return NextResponse.json({ error: "Failed to load progress" }, { status: 500 });
    }

    const { row: existing, supportsAuditColumns } = progressState;
    const now = new Date();
    const previousPosition = Math.max(0, Math.round(existing?.last_position || 0));
    const previousWatchedSeconds = Math.max(
      0,
      Math.round(existing?.watched_seconds ?? existing?.last_position ?? 0),
    );
    const allowedIncrement = supportsAuditColumns
      ? getAllowedProgressIncrement(existing?.last_progress_at, now)
      : durationSeconds;
    const maximumTrustedPosition =
      durationSeconds > 0
        ? Math.min(durationSeconds, previousPosition + allowedIncrement)
        : previousPosition + allowedIncrement;
    const nextPosition =
      requestedPosition === null
        ? previousPosition
        : Math.max(previousPosition, Math.min(requestedPosition, maximumTrustedPosition));
    const nextWatchedSeconds = Math.max(previousWatchedSeconds, nextPosition);
    const completedByPosition =
      durationSeconds > 0 && nextWatchedSeconds >= Math.ceil(durationSeconds * COMPLETION_THRESHOLD);
    const shouldComplete = Boolean(existing?.completed_at) || (Boolean(body.completed) && completedByPosition);

    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      vod_id: vodId,
      last_position: nextPosition,
    };

    if (supportsAuditColumns) {
      upsertData.watched_seconds = nextWatchedSeconds;
      upsertData.last_progress_at = now.toISOString();
    }

    if (shouldComplete) {
      upsertData.completed_at = existing?.completed_at || new Date().toISOString();
    }

    const { error } = await admin.from("lecture_progress").upsert(upsertData, {
      onConflict: "user_id,vod_id",
    });
    if (error) {
      console.error("[Lectures API] Upsert Error:", error);
      return NextResponse.json({ success: false, error: "Failed to save progress" });
    }

    return NextResponse.json({
      success: true,
      completed: shouldComplete,
      position: nextPosition,
      progressPercent: getProgressPercent(nextPosition, durationSeconds),
    });
  } catch (err) {
    console.error("[Lectures API] POST Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
