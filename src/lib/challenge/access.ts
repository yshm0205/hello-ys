import "server-only";

import { isActiveAccessPlan } from "@/lib/plans/config";
import type { EffectiveCreditInfo } from "@/lib/plans/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const CHALLENGE_LECTURE_VOD_IDS = ["vod_04", "vod_08"] as const;
export const INITIAL_CHALLENGE_LECTURE_VOD_IDS = ["vod_04"] as const;
export const DAY_2_CHALLENGE_LECTURE_VOD_IDS = ["vod_08"] as const;

const CHALLENGE_LECTURE_VOD_ID_SET = new Set<string>(CHALLENGE_LECTURE_VOD_IDS);
const UNLOCKING_SUBMISSION_STATUSES = ["submitted", "reviewed", "approved", "needs_revision"];

type ChallengeEnrollmentRow = {
  id: string;
  cohort: string;
  status: string;
  access_starts_at: string;
  access_ends_at: string | null;
};

type ChallengeSubmissionRow = {
  day: number;
  status: string;
};

export type LectureAccess =
  | { mode: "full"; allowedVodIds: null }
  | { mode: "challenge"; allowedVodIds: readonly string[] }
  | { mode: "none"; allowedVodIds: readonly string[] };

export function isChallengeLectureVod(vodId: string | null | undefined) {
  return Boolean(vodId && CHALLENGE_LECTURE_VOD_ID_SET.has(vodId));
}

export function isChallengeEnrollmentActive(row: ChallengeEnrollmentRow | null) {
  if (!row || row.status !== "active") return false;

  const now = Date.now();
  const startsAt = new Date(row.access_starts_at).getTime();
  const endsAt = row.access_ends_at ? new Date(row.access_ends_at).getTime() : null;

  if (Number.isFinite(startsAt) && now < startsAt) return false;
  if (endsAt && Number.isFinite(endsAt) && now > endsAt) return false;
  return true;
}

export async function getActiveChallengeEnrollment(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenge_enrollments")
    .select("id, cohort, status, access_starts_at, access_ends_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[ChallengeAccess] Failed to load enrollment:", error);
    return null;
  }

  const row = (data || null) as ChallengeEnrollmentRow | null;
  return isChallengeEnrollmentActive(row) ? row : null;
}

async function getChallengeSubmissionDays(userId: string, cohort: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenge_mission_submissions")
    .select("day, status")
    .eq("user_id", userId)
    .eq("cohort", cohort)
    .in("status", UNLOCKING_SUBMISSION_STATUSES);

  if (error) {
    console.error("[ChallengeAccess] Failed to load submissions:", error);
    return new Set<number>();
  }

  return new Set(((data || []) as ChallengeSubmissionRow[]).map((row) => row.day));
}

async function getAllowedChallengeLectureVodIds(userId: string, enrollment: ChallengeEnrollmentRow) {
  const submittedDays = await getChallengeSubmissionDays(userId, enrollment.cohort);
  const allowedVodIds: string[] = [...INITIAL_CHALLENGE_LECTURE_VOD_IDS];

  if (submittedDays.has(1)) {
    allowedVodIds.push(...DAY_2_CHALLENGE_LECTURE_VOD_IDS);
  }

  return allowedVodIds;
}

export async function getLectureAccessForUser(
  userId: string,
  plan: EffectiveCreditInfo | null | undefined,
): Promise<LectureAccess> {
  if (isActiveAccessPlan(plan?.plan_type, plan?.expires_at)) {
    return { mode: "full", allowedVodIds: null };
  }

  const enrollment = await getActiveChallengeEnrollment(userId);
  if (enrollment) {
    return {
      mode: "challenge",
      allowedVodIds: await getAllowedChallengeLectureVodIds(userId, enrollment),
    };
  }

  return { mode: "none", allowedVodIds: [] };
}

export async function canAccessLectureVod(
  userId: string,
  plan: EffectiveCreditInfo | null | undefined,
  vodId: string,
) {
  const access = await getLectureAccessForUser(userId, plan);
  if (access.mode === "full") return true;
  if (access.mode === "challenge") return access.allowedVodIds.includes(vodId);
  return false;
}
