import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAdminAccessLevel } from "@/lib/admin/access";
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
  day: z.number().int().min(1).max(5),
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

const deleteSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
});

const UNLOCKING_SUBMISSION_STATUSES = new Set(["submitted", "reviewed", "approved", "needs_revision"]);
const CHALLENGE_COMPLETION_DISCOUNT_AMOUNT = 20000;
const CHALLENGE_DISCOUNT_OPEN_STATUSES = new Set(["candidate", "granted"]);

function hasUnlockedSubmission(rows: SubmissionRow[], day: number) {
  return rows.some((row) => row.day === day && UNLOCKING_SUBMISSION_STATUSES.has(row.status));
}

function canSubmitChallengeDay(day: number, rows: SubmissionRow[]) {
  if (day === 1 || day === 5) return true;
  if (day === 2) return hasUnlockedSubmission(rows, 1);
  if (day === 3) return hasUnlockedSubmission(rows, 2);
  if (day === 4) return hasUnlockedSubmission(rows, 3);
  return false;
}

function getBoardLabel(day: number) {
  if (day === 4) return "수강후기";
  if (day === 5) return "질문";
  return `${day}차 인증`;
}

function toClientEnrollment(row: EnrollmentRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
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

const OFFICIAL_AUTHOR_IDS = new Set(["hmys0205", "hmys0205hmys"]);

function isChallengeModerator(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const localPart = (user.email || "").split("@")[0]?.trim().toLowerCase();
  if (localPart && OFFICIAL_AUTHOR_IDS.has(localPart)) return true;
  return getAdminAccessLevel(user.email, user.user_metadata) === "full";
}

function maskDisplayId(value: string) {
  if (value.length <= 2) return `${value[0] || ""}***`;
  if (value.length <= 4) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***`;
}

function toDisplayId(email: string | null | undefined, fallback = "참여자") {
  const localPart = (email || "").split("@")[0]?.trim();
  if (OFFICIAL_AUTHOR_IDS.has(localPart.toLowerCase())) return "원초적 인사이트";
  return localPart ? maskDisplayId(localPart) : fallback;
}

const AUTO_TITLE_SUFFIX_BY_DAY: Record<number, string> = {
  1: "채널 방향 인증",
  2: "소재 후보 인증",
  3: "최종 스크립트 인증",
};

function buildAutoSubmissionTitle(params: { day: number; cohort: string; email: string | null | undefined }) {
  const suffix = AUTO_TITLE_SUFFIX_BY_DAY[params.day];
  if (!suffix) return null;

  return `[${params.cohort} ${params.day}일차] ${toDisplayId(params.email)} ${suffix}`;
}

function buildAuthorLabels(rows: SubmissionRow[]) {
  const labels = new Map<string, string>();
  rows.forEach((row) => {
    if (!labels.has(row.user_id)) {
      labels.set(row.user_id, toDisplayId(row.email));
    }
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

function hasCommunityAccess(row: EnrollmentRow | null) {
  if (!row) return false;
  if (row.status === "completed") return true;
  return isEnrollmentActive(row);
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
    .order("created_at", { ascending: false })
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
    const canManage = isChallengeModerator(user);
    if (error) {
      return NextResponse.json({ error: "챌린지 정보를 불러오지 못했습니다." }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({
        success: true,
        enrollment: null,
        canSubmit: false,
        canComment: false,
        canManage,
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

    const authorLabels = buildAuthorLabels(feedSubmissions);

    return NextResponse.json({
      success: true,
      enrollment: toClientEnrollment(enrollment),
      canSubmit: isEnrollmentActive(enrollment),
      canComment: hasCommunityAccess(enrollment),
      canManage,
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
        { error: "선발된 챌린지 참여자만 게시글을 작성할 수 있습니다." },
        { status: 403 },
      );
    }

    const { day, title, content, referenceUrl } = parsed.data;
    const submissionTitle =
      buildAutoSubmissionTitle({
        day,
        cohort: enrollment!.cohort,
        email: user.email || enrollment!.email,
      }) || title;

    const { data: existingSubmissions, error: existingSubmissionsError } = await admin
      .from("challenge_mission_submissions")
      .select("*")
      .eq("user_id", user.id)
      .eq("cohort", enrollment!.cohort);

    if (existingSubmissionsError) {
      console.error("[Challenge API] submissions gate load error:", existingSubmissionsError);
      return NextResponse.json({ error: "미션 제출 내역을 불러오지 못했습니다." }, { status: 500 });
    }

    if (!canSubmitChallengeDay(day, ((existingSubmissions || []) as SubmissionRow[]))) {
      return NextResponse.json(
        { error: "이전 차수 미션을 먼저 제출해야 합니다." },
        { status: 403 },
      );
    }

    const payload = {
      enrollment_id: enrollment!.id,
      user_id: user.id,
      email: user.email || enrollment!.email,
      cohort: enrollment!.cohort,
      day,
      title: submissionTitle,
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
      return NextResponse.json({ error: "게시글 저장에 실패했습니다." }, { status: 500 });
    }

    const row = data as SubmissionRow;
    let nextEnrollment = enrollment!;

    if (
      row.day === 3 &&
      !(
        CHALLENGE_DISCOUNT_OPEN_STATUSES.has(enrollment!.discount_status) &&
        Number(enrollment!.discount_amount || 0) > 0
      )
    ) {
      const { data: updatedEnrollment, error: discountError } = await admin
        .from("challenge_enrollments")
        .update({
          discount_status: "granted",
          discount_amount: CHALLENGE_COMPLETION_DISCOUNT_AMOUNT,
          admin_note: "3일차 인증 제출 완료로 챌린지 완료자 할인 자동 오픈",
        })
        .eq("id", enrollment!.id)
        .select("*")
        .single();

      if (discountError || !updatedEnrollment) {
        console.error("[Challenge API] completion discount grant error:", discountError);
        return NextResponse.json({ error: "완료자 할인 적용에 실패했습니다." }, { status: 500 });
      }

      nextEnrollment = updatedEnrollment as EnrollmentRow;
    }

    const telegramResult = await notifyTelegramChallengeMissionSubmitted({
      submissionId: row.id,
      userId: user.id,
      email: user.email || row.email,
      cohort: row.cohort,
      day: row.day,
      missionLabel: getBoardLabel(row.day),
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
      enrollment: toClientEnrollment(nextEnrollment),
      submission: toClientSubmission(row),
      feedSubmission: toClientFeedSubmission(row, user.id, toDisplayId(row.email)),
    });
  } catch (error) {
    console.error("[Challenge API] POST error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    if (!isChallengeModerator(user)) {
      return NextResponse.json({ error: "인증글 삭제 권한이 없습니다." }, { status: 403 });
    }

    const parsed = deleteSubmissionSchema.safeParse({
      submissionId: request.nextUrl.searchParams.get("submissionId"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "삭제할 인증글을 확인할 수 없습니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: submission, error: loadError } = await admin
      .from("challenge_mission_submissions")
      .select("id")
      .eq("id", parsed.data.submissionId)
      .maybeSingle();

    if (loadError) {
      console.error("[Challenge API] submission delete lookup error:", loadError);
      return NextResponse.json({ error: "인증글 확인에 실패했습니다." }, { status: 500 });
    }

    if (!submission) {
      return NextResponse.json({ error: "이미 삭제되었거나 존재하지 않는 인증글입니다." }, { status: 404 });
    }

    const { error: deleteError } = await admin
      .from("challenge_mission_submissions")
      .delete()
      .eq("id", parsed.data.submissionId);

    if (deleteError) {
      console.error("[Challenge API] submission delete error:", deleteError);
      return NextResponse.json({ error: "인증글 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true, submissionId: parsed.data.submissionId });
  } catch (error) {
    console.error("[Challenge API] DELETE error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
