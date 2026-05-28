import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { notifyTelegramChallengeMissionSubmitted } from "@/lib/telegram/payments";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

type EnrollmentRow = {
  id: string;
  user_id: string;
  email: string;
  cohort: string;
  status: string;
  access_starts_at: string;
  access_ends_at: string | null;
  bonus_credits_granted: number;
  discount_status: string;
  discount_amount: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type SubmissionRow = {
  id: string;
  enrollment_id: string;
  user_id: string;
  email: string;
  cohort: string;
  day: number;
  title: string;
  content: string;
  reference_url: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const submissionSchema = z.object({
  day: z.number().int().min(1).max(3),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(10).max(5000),
  referenceUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default("")
    .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
      message: "링크는 https:// 또는 http://로 시작해야 합니다.",
    }),
});

function toClientEnrollment(row: EnrollmentRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    cohort: row.cohort,
    status: row.status,
    accessStartsAt: row.access_starts_at,
    accessEndsAt: row.access_ends_at,
    bonusCreditsGranted: row.bonus_credits_granted,
    discountStatus: row.discount_status,
    discountAmount: row.discount_amount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toClientSubmission(row: SubmissionRow) {
  return {
    id: row.id,
    cohort: row.cohort,
    day: row.day,
    title: row.title,
    content: row.content,
    referenceUrl: row.reference_url,
    status: row.status,
    adminNote: row.admin_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toClientFeedSubmission(row: SubmissionRow, viewerId: string, authorLabel: string) {
  const isMine = row.user_id === viewerId;

  return {
    ...toClientSubmission(row),
    referenceUrl: isMine ? row.reference_url : null,
    adminNote: isMine ? row.admin_note : null,
    authorLabel,
    isMine,
  };
}

function buildAuthorLabels(rows: SubmissionRow[], viewerId: string) {
  const otherUserIds = Array.from(
    new Set(rows.filter((row) => row.user_id !== viewerId).map((row) => row.user_id)),
  ).sort();

  const labels = new Map<string, string>();
  labels.set(viewerId, "나");
  otherUserIds.forEach((userId, index) => {
    labels.set(userId, `참여자 ${index + 1}`);
  });
  return labels;
}

function isEnrollmentActive(row: EnrollmentRow | null) {
  if (!row || row.status !== "active") return false;

  const now = Date.now();
  const startsAt = new Date(row.access_starts_at).getTime();
  const endsAt = row.access_ends_at ? new Date(row.access_ends_at).getTime() : null;

  if (Number.isFinite(startsAt) && now < startsAt) return false;
  if (endsAt && Number.isFinite(endsAt) && now > endsAt) return false;
  return true;
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

async function loadEnrollment(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenge_enrollments")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Challenge API] enrollment load error:", error);
    return { admin, enrollment: null, error };
  }

  return { admin, enrollment: (data as EnrollmentRow | null) ?? null, error: null };
}

async function loadFeedSubmissions(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin
    .from("challenge_mission_submissions")
    .select("*")
    .in("status", ["submitted", "reviewed", "approved"])
    .order("updated_at", { ascending: false })
    .limit(80);

  return { feedSubmissions: ((data || []) as SubmissionRow[]) ?? [], error };
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { admin, enrollment, error } = await loadEnrollment(user.id);
    if (error) {
      return NextResponse.json({ error: "챌린지 정보를 불러오지 못했습니다." }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({
        success: true,
        enrollment: null,
        canSubmit: false,
        submissions: [],
        feedSubmissions: [],
      });
    }

    const { data: submissions, error: submissionsError } = await admin
      .from("challenge_mission_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("cohort", enrollment.cohort)
      .order("day", { ascending: true });

    if (submissionsError) {
      console.error("[Challenge API] submissions load error:", submissionsError);
      return NextResponse.json({ error: "미션 제출 내역을 불러오지 못했습니다." }, { status: 500 });
    }

    const { feedSubmissions, error: feedError } = await loadFeedSubmissions(admin);
    if (feedError) {
      console.error("[Challenge API] feed submissions load error:", feedError);
      return NextResponse.json({ error: "인증글 목록을 불러오지 못했습니다." }, { status: 500 });
    }

    const authorLabels = buildAuthorLabels(feedSubmissions, user.id);

    return NextResponse.json({
      success: true,
      enrollment: toClientEnrollment(enrollment),
      canSubmit: isEnrollmentActive(enrollment),
      submissions: ((submissions || []) as SubmissionRow[]).map(toClientSubmission),
      feedSubmissions: feedSubmissions.map((row) =>
        toClientFeedSubmission(row, user.id, authorLabels.get(row.user_id) || "참여자"),
      ),
    });
  } catch (error) {
    console.error("[Challenge API] GET error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const parsed = submissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: Object.values(fieldErrors).flat()[0] || "입력값을 확인해주세요." },
        { status: 400 },
      );
    }

    const { admin, enrollment, error } = await loadEnrollment(user.id);
    if (error) {
      return NextResponse.json({ error: "챌린지 정보를 확인하지 못했습니다." }, { status: 500 });
    }

    if (!isEnrollmentActive(enrollment)) {
      return NextResponse.json(
        { error: "선발된 챌린지 참여자만 미션을 제출할 수 있습니다." },
        { status: 403 },
      );
    }

    const { day, title, content, referenceUrl } = parsed.data;
    const payload = {
      enrollment_id: enrollment!.id,
      user_id: user.id,
      email: user.email || enrollment!.email,
      cohort: enrollment!.cohort,
      day,
      title,
      content,
      reference_url: referenceUrl || null,
      status: "submitted",
      admin_note: null,
      reviewed_at: null,
    };

    const { data, error: upsertError } = await admin
      .from("challenge_mission_submissions")
      .upsert(payload, { onConflict: "user_id,cohort,day" })
      .select("*")
      .single();

    if (upsertError || !data) {
      console.error("[Challenge API] submission upsert error:", upsertError);
      return NextResponse.json({ error: "미션 제출 저장에 실패했습니다." }, { status: 500 });
    }

    const row = data as SubmissionRow;
    const telegramResult = await notifyTelegramChallengeMissionSubmitted({
      submissionId: row.id,
      userId: user.id,
      email: user.email || row.email,
      cohort: row.cohort,
      day: row.day,
      title: row.title,
      content: row.content,
      referenceUrl: row.reference_url,
      submittedAt: row.updated_at || row.created_at,
    });
    if ("skipped" in telegramResult) {
      console.warn("[Challenge API] Telegram notification skipped:", telegramResult.reason);
    }

    return NextResponse.json({
      success: true,
      submission: toClientSubmission(row),
      feedSubmission: toClientFeedSubmission(row, user.id, "나"),
    });
  } catch (error) {
    console.error("[Challenge API] POST error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
