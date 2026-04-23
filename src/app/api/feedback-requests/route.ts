import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isActiveAccessPlan } from "@/lib/plans/config";
import { getEffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

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
