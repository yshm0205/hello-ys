import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
};

type SubmissionRow = {
  id: string;
  user_id: string;
  status: string;
};

type CommentRow = {
  id: string;
  submission_id: string;
  user_id: string;
  email: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const visibleSubmissionStatuses = ["submitted", "reviewed", "approved"];

const querySchema = z.object({
  submissionId: z.string().uuid(),
});

const commentSchema = z.object({
  submissionId: z.string().uuid(),
  content: z.string().trim().min(1).max(1000),
});

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
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

async function loadEnrollment(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin
    .from("challenge_enrollments")
    .select("id, user_id, email, cohort, status, access_starts_at, access_ends_at")
    .eq("user_id", userId)
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { enrollment: (data as EnrollmentRow | null) ?? null, error };
}

async function loadVisibleSubmission(admin: ReturnType<typeof createAdminClient>, submissionId: string) {
  const { data, error } = await admin
    .from("challenge_mission_submissions")
    .select("id, user_id, status")
    .eq("id", submissionId)
    .in("status", visibleSubmissionStatuses)
    .maybeSingle();

  return { submission: (data as SubmissionRow | null) ?? null, error };
}

async function loadComments(admin: ReturnType<typeof createAdminClient>, submissionId: string) {
  const { data, error } = await admin
    .from("challenge_submission_comments")
    .select("*")
    .eq("submission_id", submissionId)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  return { comments: ((data || []) as CommentRow[]) ?? [], error };
}

function buildAuthorLabels(rows: CommentRow[], viewerId: string) {
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

function toClientComment(row: CommentRow, viewerId: string, authorLabel: string) {
  return {
    id: row.id,
    submissionId: row.submission_id,
    content: row.content,
    authorLabel,
    isMine: row.user_id === viewerId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const parsed = querySchema.safeParse({
      submissionId: request.nextUrl.searchParams.get("submissionId"),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "게시글을 확인할 수 없습니다." }, { status: 400 });
    }

    const admin = createAdminClient();
    const [
      { enrollment, error: enrollmentError },
      { submission, error: submissionError },
      { comments, error: commentsError },
    ] = await Promise.all([
      loadEnrollment(admin, user.id),
      loadVisibleSubmission(admin, parsed.data.submissionId),
      loadComments(admin, parsed.data.submissionId),
    ]);

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: "챌린지 참여자만 댓글을 볼 수 있습니다." }, { status: 403 });
    }

    if (submissionError || !submission) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    if (commentsError) {
      console.error("[Challenge Comments] GET error:", commentsError);
      return NextResponse.json({ error: "댓글을 불러오지 못했습니다." }, { status: 500 });
    }

    const rows = comments;
    const authorLabels = buildAuthorLabels(rows, user.id);

    return NextResponse.json({
      success: true,
      comments: rows.map((row) =>
        toClientComment(row, user.id, authorLabels.get(row.user_id) || "참여자"),
      ),
    });
  } catch (error) {
    console.error("[Challenge Comments] GET fatal:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const parsed = commentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
    }

    const admin = createAdminClient();
    const [{ enrollment, error: enrollmentError }, { submission, error: submissionError }] =
      await Promise.all([
        loadEnrollment(admin, user.id),
        loadVisibleSubmission(admin, parsed.data.submissionId),
      ]);

    if (enrollmentError || !isEnrollmentActive(enrollment)) {
      return NextResponse.json({ error: "활성 챌린지 참여자만 댓글을 쓸 수 있습니다." }, { status: 403 });
    }

    if (submissionError || !submission) {
      return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
    }

    const payload = {
      submission_id: parsed.data.submissionId,
      user_id: user.id,
      email: user.email || enrollment!.email,
      content: parsed.data.content,
      status: "visible",
    };

    const { data, error } = await admin
      .from("challenge_submission_comments")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("[Challenge Comments] POST error:", error);
      return NextResponse.json({ error: "댓글 저장에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comment: toClientComment(data as CommentRow, user.id, "나"),
    });
  } catch (error) {
    console.error("[Challenge Comments] POST fatal:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
