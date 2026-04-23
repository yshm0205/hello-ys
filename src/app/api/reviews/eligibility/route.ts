import { NextResponse } from "next/server";

import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const VOD_THRESHOLD = 3;
const WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        eligible: false,
        reason: "unauthenticated",
        vodThreshold: VOD_THRESHOLD,
        windowDays: WINDOW_DAYS,
      });
    }

    const plan = await getEffectiveCreditInfo(user.id);
    if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
      return NextResponse.json({
        eligible: false,
        reason: "no-plan",
        vodThreshold: VOD_THRESHOLD,
        windowDays: WINDOW_DAYS,
      });
    }

    const admin = createAdminClient();

    const { data: planRow } = await admin
      .from("user_plans")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    let anchor: string | null = planRow?.created_at ?? null;
    if (!anchor) {
      const { data: firstPayment } = await admin
        .from("toss_payments")
        .select("updated_at")
        .eq("user_id", user.id)
        .eq("status", "DONE")
        .order("updated_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      anchor = firstPayment?.updated_at ?? null;
    }

    if (!anchor) {
      return NextResponse.json({
        eligible: false,
        reason: "no-anchor",
        vodThreshold: VOD_THRESHOLD,
        windowDays: WINDOW_DAYS,
      });
    }

    const isAdmin = !!user.email && ADMIN_EMAILS.includes(user.email);
    const anchorMs = new Date(anchor).getTime();
    const windowEndMs = anchorMs + WINDOW_DAYS * DAY_MS;
    const nowMs = Date.now();
    const rawDaysLeft = Math.max(0, Math.ceil((windowEndMs - nowMs) / DAY_MS));
    const rawWindowClosed = nowMs > windowEndMs;
    // 관리자는 윈도우 무시 (항상 미리보기 가능)
    const windowClosed = isAdmin ? false : rawWindowClosed;
    const daysLeft = isAdmin ? Math.max(rawDaysLeft, WINDOW_DAYS) : rawDaysLeft;

    const { data: review } = await admin
      .from("student_reviews")
      .select("id, status, feedback_tickets_granted, feedback_tickets_remaining")
      .eq("user_id", user.id)
      .maybeSingle();

    const { count } = await admin
      .from("lecture_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const vodsCompleted = count || 0;
    const alreadySubmitted = !!review;
    const reachedThreshold = vodsCompleted >= VOD_THRESHOLD;
    // 제출 자격: 7일 윈도우 내 + 최소 VOD 1개 수강 (완전 무경험자 차단)
    const canSubmit = !alreadySubmitted && !windowClosed && vodsCompleted >= 1;
    // 배너 노출: 윈도우 내면 항상 노출 (진행도 표시)
    const eligible = !alreadySubmitted && !windowClosed;

    return NextResponse.json({
      eligible,
      canSubmit,
      windowClosed,
      alreadySubmitted,
      reachedThreshold,
      daysLeft,
      vodsCompleted,
      vodThreshold: VOD_THRESHOLD,
      windowDays: WINDOW_DAYS,
      review: review
        ? {
            feedbackTicketsGranted: review.feedback_tickets_granted,
            feedbackTicketsRemaining: review.feedback_tickets_remaining,
            status: review.status,
          }
        : null,
    });
  } catch (error) {
    console.error("[Reviews Eligibility] GET error:", error);
    return NextResponse.json({
      eligible: false,
      reason: "error",
      vodThreshold: VOD_THRESHOLD,
      windowDays: WINDOW_DAYS,
    });
  }
}
