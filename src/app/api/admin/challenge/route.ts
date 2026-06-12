import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { getAdminAccessLevel } from "@/lib/admin/access";
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

const CHALLENGE_DAY_2_BONUS_CREDITS = 30;

const enrollSchema = z.object({
  email: z.string().trim().email(),
  cohort: z.string().trim().min(1).max(40).default("1기"),
  bonusCredits: z.number().int().min(0).max(100).default(CHALLENGE_DAY_2_BONUS_CREDITS),
  accessEndsAt: z.string().trim().optional().default(""),
  adminNote: z.string().trim().max(1000).optional().default(""),
});

const patchSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("enrollment"),
    id: z.string().uuid(),
    status: z.enum(["active", "paused", "completed", "removed"]).optional(),
    discountStatus: z.enum(["none", "candidate", "granted", "not_eligible"]).optional(),
    discountAmount: z.number().int().min(0).max(50000).optional(),
    adminNote: z.string().max(1000).optional(),
  }),
  z.object({
    kind: z.literal("submission"),
    id: z.string().uuid(),
    status: z.enum(["submitted", "reviewed", "approved", "needs_revision"]),
    adminNote: z.string().max(1000).optional(),
  }),
]);

async function requireFullAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const accessLevel = getAdminAccessLevel(user?.email, user?.user_metadata);
  if (!user?.email || accessLevel !== "full") return null;

  return user;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await admin
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[Admin Challenge] user lookup error:", error);
  }

  return (data as { id: string; email: string | null } | null) ?? null;
}

async function grantChallengeCredits(params: {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  amount: number;
  cohort: string;
  adminEmail: string;
}) {
  if (params.amount <= 0) return { success: true, granted: 0 };

  const current = await loadCreditPlanSnapshot(params.admin, params.userId);
  if (!current) return { success: false, granted: 0 };

  const updateResult = await updateCreditPlanBalances(params.admin, {
    userId: params.userId,
    current,
    subscriptionCredits: current.subscriptionCredits,
    purchasedCredits: current.purchasedCredits + params.amount,
    planType: current.planType,
    expiresAt: current.expiresAt,
  });

  if (!updateResult.success) {
    console.error("[Admin Challenge] credit grant error:", updateResult.error);
    return { success: false, granted: 0 };
  }

  await recordCreditTransaction({
    userId: params.userId,
    type: "manual_add",
    amount: params.amount,
    balanceAfter: updateResult.plan.credits,
    description: "challenge bonus credits",
    adminNote: `${params.cohort} challenge day 2 approval`,
    metadata: {
      source: "challenge_day_2_approval",
      cohort: params.cohort,
      adminEmail: params.adminEmail,
    },
  });

  return { success: true, granted: params.amount };
}

export async function GET() {
  try {
    const adminUser = await requireFullAdmin();
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();
    const [enrollmentsResult, submissionsResult] = await Promise.all([
      admin
        .from("challenge_enrollments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("challenge_mission_submissions")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(300),
    ]);

    if (enrollmentsResult.error) {
      console.error("[Admin Challenge] enrollments GET error:", enrollmentsResult.error);
      return NextResponse.json({ error: "참여자 목록을 불러오지 못했습니다." }, { status: 500 });
    }

    if (submissionsResult.error) {
      console.error("[Admin Challenge] submissions GET error:", submissionsResult.error);
      return NextResponse.json({ error: "제출 내역을 불러오지 못했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enrollments: (enrollmentsResult.data || []) as EnrollmentRow[],
      submissions: (submissionsResult.data || []) as SubmissionRow[],
    });
  } catch (error) {
    console.error("[Admin Challenge] GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireFullAdmin();
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = enrollSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const admin = createAdminClient();
    const email = normalizeEmail(parsed.data.email);
    const targetUser = await findUserByEmail(admin, email);
    if (!targetUser) {
      return NextResponse.json(
        { error: "가입된 이메일을 찾지 못했습니다. 먼저 FlowSpot 회원가입이 필요합니다." },
        { status: 404 },
      );
    }

    const { data: existing, error: existingError } = await admin
      .from("challenge_enrollments")
      .select("*")
      .eq("user_id", targetUser.id)
      .eq("cohort", parsed.data.cohort)
      .maybeSingle();

    if (existingError) {
      console.error("[Admin Challenge] existing enrollment lookup error:", existingError);
      return NextResponse.json({ error: "참여자 등록 상태를 확인하지 못했습니다." }, { status: 500 });
    }

    const existingEnrollment = (existing as EnrollmentRow | null) ?? null;
    let grantedCredits = 0;
    const shouldGrantOnEnrollment = false;

    if (shouldGrantOnEnrollment && (!existingEnrollment || existingEnrollment.bonus_credits_granted === 0)) {
      const grantResult = await grantChallengeCredits({
        admin,
        userId: targetUser.id,
        amount: parsed.data.bonusCredits,
        cohort: parsed.data.cohort,
        adminEmail: adminUser.email!,
      });

      if (!grantResult.success) {
        return NextResponse.json({ error: "크레딧 지급에 실패했습니다." }, { status: 500 });
      }

      grantedCredits = grantResult.granted;
    }

    const payload = {
      user_id: targetUser.id,
      email,
      cohort: parsed.data.cohort,
      status: "active",
      access_ends_at: parsed.data.accessEndsAt || null,
      bonus_credits_granted: existingEnrollment?.bonus_credits_granted || 0,
      admin_note: parsed.data.adminNote || existingEnrollment?.admin_note || null,
    };

    const { data, error } = await admin
      .from("challenge_enrollments")
      .upsert(payload, { onConflict: "user_id,cohort" })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[Admin Challenge] enrollment upsert error:", error);
      return NextResponse.json({ error: "참여자 등록에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enrollment: data as EnrollmentRow,
      grantedCredits,
    });
  } catch (error) {
    console.error("[Admin Challenge] POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireFullAdmin();
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();

    if (parsed.data.kind === "enrollment") {
      const patch: Record<string, unknown> = {};
      if (parsed.data.status) patch.status = parsed.data.status;
      if (parsed.data.discountStatus) patch.discount_status = parsed.data.discountStatus;
      if (typeof parsed.data.discountAmount === "number") {
        patch.discount_amount = parsed.data.discountAmount;
      }
      if (typeof parsed.data.adminNote === "string") patch.admin_note = parsed.data.adminNote;

      const { data, error } = await admin
        .from("challenge_enrollments")
        .update(patch)
        .eq("id", parsed.data.id)
        .select("*")
        .single();

      if (error) {
        console.error("[Admin Challenge] enrollment PATCH error:", error);
        return NextResponse.json({ error: "참여자 업데이트에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ success: true, enrollment: data as EnrollmentRow });
    }

    const submissionPatch: Record<string, unknown> = {
      status: parsed.data.status,
    };
    if (typeof parsed.data.adminNote === "string") {
      submissionPatch.admin_note = parsed.data.adminNote;
    }
    if (["reviewed", "approved", "needs_revision"].includes(parsed.data.status)) {
      submissionPatch.reviewed_at = now;
    }

    const { data, error } = await admin
      .from("challenge_mission_submissions")
      .update(submissionPatch)
      .eq("id", parsed.data.id)
      .select("*")
      .single();

    if (error) {
      console.error("[Admin Challenge] submission PATCH error:", error);
      return NextResponse.json({ error: "제출물 업데이트에 실패했습니다." }, { status: 500 });
    }

    const submission = data as SubmissionRow;

    if (submission.day === 2 && parsed.data.status === "approved") {
      const { data: enrollmentData, error: enrollmentError } = await admin
        .from("challenge_enrollments")
        .select("*")
        .eq("id", submission.enrollment_id)
        .single();

      const enrollment = (enrollmentData as EnrollmentRow | null) ?? null;

      if (enrollmentError || !enrollment) {
        console.error("[Admin Challenge] day 2 bonus enrollment lookup error:", enrollmentError);
        return NextResponse.json({ error: "2차 승인 크레딧 지급 대상 확인에 실패했습니다." }, { status: 500 });
      }

      if ((enrollment.bonus_credits_granted || 0) === 0) {
        const grantResult = await grantChallengeCredits({
          admin,
          userId: submission.user_id,
          amount: CHALLENGE_DAY_2_BONUS_CREDITS,
          cohort: submission.cohort,
          adminEmail: adminUser.email!,
        });

        if (!grantResult.success) {
          return NextResponse.json({ error: "2차 승인 크레딧 지급에 실패했습니다." }, { status: 500 });
        }

        const { error: updateEnrollmentError } = await admin
          .from("challenge_enrollments")
          .update({ bonus_credits_granted: grantResult.granted })
          .eq("id", enrollment.id);

        if (updateEnrollmentError) {
          console.error("[Admin Challenge] day 2 bonus mark error:", updateEnrollmentError);
          return NextResponse.json({ error: "2차 승인 크레딧 지급 기록에 실패했습니다." }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("[Admin Challenge] PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
