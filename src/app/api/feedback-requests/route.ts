import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { getResendClient } from "@/lib/resend/client";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const TYPE_LABELS: Record<string, string> = {
  channel: "채널 방향",
  topic: "주제 기획",
  script: "스크립트",
  other: "기타",
};

async function notifyAdminsNewFeedback(payload: {
  userEmail: string | null;
  requestType: string;
  title: string;
  description: string;
  referenceUrl: string | null;
  requestId: string;
}) {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (admins.length === 0) return;

  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) return;

  const typeLabel = TYPE_LABELS[payload.requestType] || payload.requestType;
  const preview = payload.description.length > 400
    ? `${payload.description.slice(0, 400)}...`
    : payload.description;
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://flowspot.kr"}/ko/admin/feedback-requests`;

  try {
    await resend.emails.send({
      from,
      to: admins,
      subject: `[FlowSpot] 새 피드백 요청 — ${payload.title}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <h2 style="margin:0 0 8px;color:#8b5cf6">새 피드백 요청이 도착했어요</h2>
          <p style="color:#666;margin:0 0 20px">요청자: <strong>${payload.userEmail || "(이메일 미확인)"}</strong></p>
          <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;padding:16px;margin-bottom:16px">
            <div style="font-size:12px;color:#7c3aed;font-weight:600;margin-bottom:4px">${typeLabel}</div>
            <div style="font-size:18px;font-weight:700;margin-bottom:12px">${payload.title}</div>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#333">${preview}</div>
            ${payload.referenceUrl ? `<div style="margin-top:12px;font-size:13px"><a href="${payload.referenceUrl}" style="color:#8b5cf6">참고 링크 →</a></div>` : ""}
          </div>
          <a href="${adminUrl}" style="display:inline-block;background:#8b5cf6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">답변하러 가기</a>
          <p style="color:#999;font-size:12px;margin-top:24px">요청 ID: ${payload.requestId}</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[FeedbackRequests API] admin email notify error:", error);
  }
}

const requestSchema = z.object({
  requestType: z.enum(["channel", "topic", "script", "other"]),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(30).max(3000),
  referenceUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "URL은 https:// 또는 http://로 시작해야 합니다.",
    }),
});

type DbRequest = {
  id: string;
  request_type: string;
  title: string;
  description: string;
  reference_url: string | null;
  status: string;
  admin_response: string | null;
  admin_note: string | null;
  responded_at: string | null;
  closed_at: string | null;
  created_at: string;
};

function toClient(row: DbRequest) {
  return {
    id: row.id,
    requestType: row.request_type,
    title: row.title,
    description: row.description,
    referenceUrl: row.reference_url,
    status: row.status,
    adminResponse: row.admin_response,
    respondedAt: row.responded_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
  };
}

async function requireActiveUser() {
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
        { error: "피드백권은 올인원 이용권 보유자만 사용할 수 있습니다." },
        { status: 403 },
      ),
      user: null,
    };
  }

  return { response: null, user };
}

export async function GET() {
  try {
    const { response, user } = await requireActiveUser();
    if (response || !user) return response;

    const admin = createAdminClient();
    const { data: review } = await admin
      .from("student_reviews")
      .select("id, feedback_tickets_granted, feedback_tickets_remaining")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: requests, error } = await admin
      .from("feedback_requests")
      .select(
        "id, request_type, title, description, reference_url, status, admin_response, admin_note, responded_at, closed_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[FeedbackRequests API] GET list error:", error);
      return NextResponse.json(
        { error: "피드백 요청 내역을 불러오지 못했습니다." },
        { status: 500 },
      );
    }

    // 대시보드 피드백 탭 진입 시 답변 완료된 요청들을 읽음 처리
    void admin
      .from("feedback_requests")
      .update({ user_read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("status", "answered")
      .is("user_read_at", null)
      .then(({ error: markError }) => {
        if (markError) {
          console.error("[FeedbackRequests API] mark-read error:", markError);
        }
      });

    return NextResponse.json({
      success: true,
      review: review
        ? {
            id: review.id,
            feedbackTicketsGranted: review.feedback_tickets_granted,
            feedbackTicketsRemaining: review.feedback_tickets_remaining,
          }
        : null,
      requests: (requests || []).map((r) => toClient(r as DbRequest)),
    });
  } catch (error) {
    console.error("[FeedbackRequests API] GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { response, user } = await requireActiveUser();
    if (response || !user) return response;

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: Object.values(fieldErrors).flat()[0] || "입력값을 확인해주세요." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: review } = await admin
      .from("student_reviews")
      .select("id, feedback_tickets_remaining")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!review) {
      return NextResponse.json(
        { error: "피드백권은 후기 제출자만 사용할 수 있습니다. 먼저 수강 후기를 남겨주세요." },
        { status: 403 },
      );
    }

    if ((review.feedback_tickets_remaining ?? 0) <= 0) {
      return NextResponse.json(
        { error: "남은 피드백권이 없습니다. (3회 모두 소진)" },
        { status: 403 },
      );
    }

    const { requestType, title, description, referenceUrl } = parsed.data;

    const { data: inserted, error: insertError } = await admin
      .from("feedback_requests")
      .insert({
        user_id: user.id,
        review_id: review.id,
        request_type: requestType,
        title,
        description,
        reference_url: referenceUrl || null,
        status: "submitted",
      })
      .select(
        "id, request_type, title, description, reference_url, status, admin_response, admin_note, responded_at, closed_at, created_at",
      )
      .single();

    if (insertError || !inserted) {
      console.error("[FeedbackRequests API] insert error:", insertError);
      return NextResponse.json({ error: "피드백 요청을 저장하지 못했습니다." }, { status: 500 });
    }

    const newRemaining = Math.max(0, (review.feedback_tickets_remaining ?? 0) - 1);
    const { error: updateError } = await admin
      .from("student_reviews")
      .update({ feedback_tickets_remaining: newRemaining })
      .eq("id", review.id);

    if (updateError) {
      console.error("[FeedbackRequests API] ticket decrement error:", updateError);
      // Rollback the insert to keep data consistent
      await admin.from("feedback_requests").delete().eq("id", inserted.id);
      return NextResponse.json(
        { error: "피드백권 차감에 실패했습니다. 다시 시도해주세요." },
        { status: 500 },
      );
    }

    // 관리자 이메일 알림 (실패해도 메인 흐름 유지)
    void notifyAdminsNewFeedback({
      userEmail: user.email ?? null,
      requestType: inserted.request_type,
      title: inserted.title,
      description: inserted.description,
      referenceUrl: inserted.reference_url,
      requestId: inserted.id,
    });

    return NextResponse.json({
      success: true,
      request: toClient(inserted as DbRequest),
      feedbackTicketsRemaining: newRemaining,
    });
  } catch (error) {
    console.error("[FeedbackRequests API] POST error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
