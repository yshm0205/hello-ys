import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getResendClient } from "@/lib/resend/client";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const TYPE_LABELS: Record<string, string> = {
  channel: "채널 방향",
  topic: "주제 기획",
  script: "스크립트",
  other: "기타",
};

async function notifyUserAnswered(payload: {
  toEmail: string;
  title: string;
  requestType: string;
  adminResponse: string;
}) {
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!resend || !from) return;

  const typeLabel = TYPE_LABELS[payload.requestType] || payload.requestType;
  const preview = payload.adminResponse.length > 500
    ? `${payload.adminResponse.slice(0, 500)}...`
    : payload.adminResponse;
  const userUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://flowspot.kr"}/ko/dashboard/feedback`;

  try {
    await resend.emails.send({
      from,
      to: payload.toEmail,
      subject: `[FlowSpot] 피드백 답변이 도착했어요 — ${payload.title}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
          <h2 style="margin:0 0 8px;color:#8b5cf6">피드백 답변이 도착했어요 🎉</h2>
          <p style="color:#666;margin:0 0 20px">요청하신 <strong>${typeLabel}</strong> 피드백에 운영진이 답변을 드렸어요.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:16px">
            <div style="font-size:12px;color:#16a34a;font-weight:600;margin-bottom:4px">운영진 답변</div>
            <div style="font-size:16px;font-weight:700;margin-bottom:12px">${payload.title}</div>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.6;color:#333">${preview}</div>
          </div>
          <a href="${userUrl}" style="display:inline-block;background:#8b5cf6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">전체 답변 보러 가기</a>
          <p style="color:#999;font-size:12px;margin-top:24px">대시보드에서 답변 전체를 확인하고, 남은 피드백권으로 추가 요청도 보낼 수 있어요.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Admin FeedbackRequests] user notify error:", error);
  }
}

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;
  return user;
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["submitted", "in_progress", "answered", "closed", "rejected"]),
  adminNote: z.string().max(2000).optional(),
  adminResponse: z.string().max(5000).optional(),
});

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback_requests")
    .select(
      `id, user_id, review_id, request_type, title, description, reference_url,
       status, admin_note, admin_response, responded_at, closed_at, created_at, updated_at,
       users:user_id(email, full_name),
       reviews:review_id(headline, channel_name, feedback_tickets_remaining, feedback_tickets_granted)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin FeedbackRequests] GET error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true, requests: data || [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, status, adminNote, adminResponse } = parsed.data;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { status };
  if (typeof adminNote === "string") patch.admin_note = adminNote;
  if (typeof adminResponse === "string") patch.admin_response = adminResponse;
  if (status === "answered") patch.responded_at = now;
  if (status === "closed" || status === "rejected") patch.closed_at = now;

  const { data, error } = await supabase
    .from("feedback_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[Admin FeedbackRequests] PATCH error:", error);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }

  // 답변 완료로 전환 + 답변 텍스트 있으면 유저에게 이메일 알림
  if (status === "answered" && data?.admin_response && data?.user_id) {
    const { data: userRow } = await supabase
      .from("users")
      .select("email")
      .eq("id", data.user_id)
      .maybeSingle();
    if (userRow?.email) {
      void notifyUserAnswered({
        toEmail: userRow.email,
        title: data.title,
        requestType: data.request_type,
        adminResponse: data.admin_response,
      });
    }
  }

  return NextResponse.json({ success: true, request: data });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
