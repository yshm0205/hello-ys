import "server-only";

import {
  EARLYBIRD_CONFIG,
  type EarlybirdTier,
  type EarlybirdTierKey,
} from "@/lib/plans/config";
import { createAdminClient } from "@/utils/supabase/admin";

export type EarlybirdSummary = {
  currentTier: EarlybirdTier;
  phase1SoldCount: number;
  phase1Remaining: number;
  phase1Total: number;
  phase2SoldCount: number;
  phase2Remaining: number;
  phase2Total: number;
  tier1Deadline: string;
  countsAreEstimated: boolean;
};

const EARLYBIRD_RESERVED_PAYMENT_WINDOW_MINUTES = 20;
const EARLYBIRD_COMMITTED_STATUSES = ["DONE", "CREDIT_GRANT_FAILED"];
const EARLYBIRD_RESERVED_STATUSES = ["PENDING", "PROCESSING"];

export const EARLYBIRD_FALLBACK_SUMMARY: EarlybirdSummary = {
  currentTier: "phase1",
  phase1SoldCount: 0,
  phase1Remaining: EARLYBIRD_CONFIG.phase1.totalSlots,
  phase1Total: EARLYBIRD_CONFIG.phase1.totalSlots,
  phase2SoldCount: 0,
  phase2Remaining: EARLYBIRD_CONFIG.phase2.totalSlots,
  phase2Total: EARLYBIRD_CONFIG.phase2.totalSlots,
  tier1Deadline: EARLYBIRD_CONFIG.phase1.hardDeadline,
  countsAreEstimated: true,
};

function clampRemaining(total: number, soldCount: number) {
  return Math.max(0, total - soldCount);
}

async function countInitialProgramPaymentsByTier(
  adminClient: ReturnType<typeof createAdminClient>,
  tier: EarlybirdTierKey,
  statuses: string[],
  createdAfter?: string,
) {
  let query = adminClient
    .from("toss_payments")
    .select("order_id", { count: "exact", head: true })
    .in("status", statuses)
    .contains("metadata", {
      paymentKind: "initial_program",
      earlybirdTier: tier,
    });

  if (createdAfter) {
    query = query.gte("created_at", createdAfter);
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function countOccupiedInitialProgramByTier(
  adminClient: ReturnType<typeof createAdminClient>,
  tier: EarlybirdTierKey,
) {
  const reservedSince = new Date(
    Date.now() - EARLYBIRD_RESERVED_PAYMENT_WINDOW_MINUTES * 60 * 1000,
  ).toISOString();

  const [committedCount, reservedCount] = await Promise.all([
    countInitialProgramPaymentsByTier(adminClient, tier, EARLYBIRD_COMMITTED_STATUSES),
    countInitialProgramPaymentsByTier(
      adminClient,
      tier,
      EARLYBIRD_RESERVED_STATUSES,
      reservedSince,
    ),
  ]);

  return committedCount + reservedCount;
}

export function resolveEarlybirdTier(
  summary: Pick<EarlybirdSummary, "phase1SoldCount" | "phase2SoldCount">,
  now = new Date(),
): EarlybirdTier {
  const tier1Deadline = new Date(EARLYBIRD_CONFIG.phase1.hardDeadline);
  const tier2Deadline = new Date(EARLYBIRD_CONFIG.phase2.hardDeadline);

  const beforeTier1 = now.getTime() <= tier1Deadline.getTime();
  if (beforeTier1 && summary.phase1SoldCount < EARLYBIRD_CONFIG.phase1.totalSlots) {
    return "phase1";
  }

  const beforeTier2 = now.getTime() <= tier2Deadline.getTime();
  if (beforeTier2 && summary.phase2SoldCount < EARLYBIRD_CONFIG.phase2.totalSlots) {
    return "phase2";
  }

  return "ended";
}

export async function getEarlybirdSummary(
  adminClient: ReturnType<typeof createAdminClient> = createAdminClient(),
): Promise<EarlybirdSummary> {
  const [phase1SoldCount, phase2SoldCount] = await Promise.all([
    countOccupiedInitialProgramByTier(adminClient, "phase1"),
    countOccupiedInitialProgramByTier(adminClient, "phase2"),
  ]);

  const summary: EarlybirdSummary = {
    currentTier: resolveEarlybirdTier({ phase1SoldCount, phase2SoldCount }),
    phase1SoldCount,
    phase1Remaining: clampRemaining(EARLYBIRD_CONFIG.phase1.totalSlots, phase1SoldCount),
    phase1Total: EARLYBIRD_CONFIG.phase1.totalSlots,
    phase2SoldCount,
    phase2Remaining: clampRemaining(EARLYBIRD_CONFIG.phase2.totalSlots, phase2SoldCount),
    phase2Total: EARLYBIRD_CONFIG.phase2.totalSlots,
    tier1Deadline: EARLYBIRD_CONFIG.phase1.hardDeadline,
    countsAreEstimated: false,
  };

  return summary;
}
