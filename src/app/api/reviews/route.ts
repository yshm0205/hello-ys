import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  headline: z.string().trim().max(80).optional().default(""),
  content: z.string().trim().min(30).max(2500),
  channelName: z.string().trim().max(80).optional().default(""),
  proofUrl: z
    .string()
    .trim()
    .max(300)
    .optional()
    .default("")
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "URL은 https:// 또는 http://로 시작해야 합니다.",
    }),
  marketingConsent: z.boolean().refine((value) => value === true, {
    message: "후기 이벤트 혜택을 받으려면 마케팅 활용 동의가 필요합니다.",
  }),
});

const REVIEW_BENEFITS = {
  kakao_private_room: true,
  update_topic_early_access: true,
  feedback_tickets: 3,
  monthly_random_credit_draw: true,
} as const;

const REVIEW_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function resolveReviewWindowAnchor(userId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: planRow } = await admin
    .from("user_plans")
    .select("created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (planRow?.created_at) return planRow.created_at;

  const { data: firstPayment } = await admin
    .from("toss_payments")
    .select("updated_at")
    .eq("user_id", userId)
    .eq("status", "DONE")
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return firstPayment?.updated_at ?? null;
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

function toClientReview(row: Record<string, unknown> | null | undefined) {
  if (!row) return null;

  return {
    id: row.id,
    rating: row.rating,
    headline: row.headline,
    content: row.content,
    channelName: row.channel_name,
    status: row.status,
    marketingConsent: row.marketing_consent,
    feedbackTicketsGranted: row.feedback_tickets_granted,
    feedbackTicketsRemaining: row.feedback_tickets_remaining,
    monthlyDrawEligible: row.monthly_draw_eligible,
    createdAt: row.created_at,
  };
}

async function getAuthenticatedActiveUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
      user: null,
    };
  }

  const plan = await getEffectiveCreditInfo(user.id);
  if (!isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
    return {
      response: NextResponse.json(
        { error: "수강 후기 이벤트는 올인원 이용권 보유자만 참여할 수 있습니다." },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { response: null, user };
}

export async function GET() {
  try {
    const { response, user } = await getAuthenticatedActiveUser();
    if (response || !user) return response;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("student_reviews")
      .select(
        "id, rating, headline, content, channel_name, status, marketing_consent, feedback_tickets_granted, feedback_tickets_remaining, monthly_draw_eligible, created_at",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Reviews API] Failed to load review:", error);
      return NextResponse.json({ error: "후기 정보를 불러오지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review: toClientReview(data),
      kakaoInviteUrl: data ? getKakaoInviteUrl() : null,
      kakaoInvitePassword: data ? getKakaoInvitePassword() : null,
    });
  } catch (error) {
    console.error("[Reviews API] GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response, user } = await getAuthenticatedActiveUser();
    if (response || !user) return response;

    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: Object.values(fieldErrors).flat()[0] || "입력값을 확인해주세요." },
        { status: 400 },
      );
    }

    const anchor = await resolveReviewWindowAnchor(user.id);
    if (!anchor) {
      return NextResponse.json(
        { error: "후기 이벤트 참여 자격을 확인하지 못했습니다." },
        { status: 403 },
      );
    }
    const isAdmin = !!user.email && ADMIN_EMAILS.includes(user.email);
    const windowEndMs = new Date(anchor).getTime() + REVIEW_WINDOW_DAYS * DAY_MS;
    if (!isAdmin && Date.now() > windowEndMs) {
      return NextResponse.json(
        { error: "후기 이벤트 참여 기간(결제 후 7일)이 종료되었습니다." },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { rating, headline, content, channelName, proofUrl, marketingConsent } = parsed.data;
    const { data, error } = await admin
      .from("student_reviews")
      .insert({
        user_id: user.id,
        email: user.email || "",
        rating,
        headline: headline || null,
        content,
        channel_name: channelName || null,
        proof_url: proofUrl || null,
        marketing_consent: marketingConsent,
        benefits: REVIEW_BENEFITS,
        feedback_tickets_granted: REVIEW_BENEFITS.feedback_tickets,
        feedback_tickets_remaining: REVIEW_BENEFITS.feedback_tickets,
        monthly_draw_eligible: true,
        status: "submitted",
      })
      .select(
        "id, rating, headline, content, channel_name, status, marketing_consent, feedback_tickets_granted, feedback_tickets_remaining, monthly_draw_eligible, created_at",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        const existing = await admin
          .from("student_reviews")
          .select(
            "id, rating, headline, content, channel_name, status, marketing_consent, feedback_tickets_granted, feedback_tickets_remaining, monthly_draw_eligible, created_at",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        return NextResponse.json(
          {
            error: "이미 후기를 제출했습니다.",
            review: toClientReview(existing.data),
            kakaoInviteUrl: existing.data ? getKakaoInviteUrl() : null,
            kakaoInvitePassword: existing.data ? getKakaoInvitePassword() : null,
          },
          { status: 409 },
        );
      }

      console.error("[Reviews API] Failed to submit review:", error);
      return NextResponse.json({ error: "후기 제출에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review: toClientReview(data),
      kakaoInviteUrl: getKakaoInviteUrl(),
      kakaoInvitePassword: getKakaoInvitePassword(),
    });
  } catch (error) {
    console.error("[Reviews API] POST error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
