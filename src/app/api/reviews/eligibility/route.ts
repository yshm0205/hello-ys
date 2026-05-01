import { NextResponse } from "next/server";

import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function resolveReviewWindowAnchor(userId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: firstPayment } = await admin
    .from("toss_payments")
    .select("updated_at")
    .eq("user_id", userId)
    .eq("status", "DONE")
    .contains("metadata", { paymentKind: "initial_program" })
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstPayment?.updated_at) {
    return firstPayment.updated_at;
  }

  const { data: planRow } = await admin
    .from("user_plans")
    .select("created_at")
    .eq("user_id", userId)
    .maybeSingle();

  return planRow?.created_at ?? null;
}

function getKakaoInviteUrl() {
  return process.env.REVIEW_KAKAO_INVITE_URL || process.env.KAKAO_REVIEW_INVITE_URL || null;
}

function getKakaoInvitePassword() {
  return (
    process.env.REVIEW_KAKAO_INVITE_PASSWORD ||
    process.env.KAKAO_REVIEW_INVITE_PASSWORD ||
    null
  );
}

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
        vodThreshold: 0,
        windowDays: WINDOW_DAYS,
      });
    }

    const plan = await getEffectiveCreditInfo(user.id);
    if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
      return NextResponse.json({
        eligible: false,
        reason: "no-plan",
        vodThreshold: 0,
        windowDays: WINDOW_DAYS,
      });
    }

    const admin = createAdminClient();
    const anchor = await resolveReviewWindowAnchor(user.id);

    if (!anchor) {
      return NextResponse.json({
        eligible: false,
        reason: "no-anchor",
        vodThreshold: 0,
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

    const alreadySubmitted = !!review;

    // 미확인 피드백 답변 수 (제출자만)
    let unreadFeedbackCount = 0;
    if (alreadySubmitted) {
      const { count: unreadCount } = await admin
        .from("feedback_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "answered")
        .is("user_read_at", null);
      unreadFeedbackCount = unreadCount || 0;
    }
    // 제출 자격: 구매자 전용 혜택 기간 안이면 바로 가능
    const canSubmit = !alreadySubmitted && !windowClosed;
    // 배너 노출: 윈도우 내면 항상 노출
    const eligible = !alreadySubmitted && !windowClosed;

    return NextResponse.json({
      eligible,
      canSubmit,
      windowClosed,
      alreadySubmitted,
      reachedThreshold: true,
      daysLeft,
      vodsCompleted: 0,
      vodThreshold: 0,
      windowDays: WINDOW_DAYS,
      review: review
        ? {
            feedbackTicketsGranted: review.feedback_tickets_granted,
            feedbackTicketsRemaining: review.feedback_tickets_remaining,
            status: review.status,
          }
        : null,
      kakaoInviteUrl: alreadySubmitted ? getKakaoInviteUrl() : null,
      kakaoInvitePassword: alreadySubmitted ? getKakaoInvitePassword() : null,
      unreadFeedbackCount,
    });
  } catch (error) {
    console.error("[Reviews Eligibility] GET error:", error);
    return NextResponse.json({
      eligible: false,
      reason: "error",
      vodThreshold: 0,
      windowDays: WINDOW_DAYS,
    });
  }
}
