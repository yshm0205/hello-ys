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
};

export const EARLYBIRD_FALLBACK_SUMMARY: EarlybirdSummary = {
  currentTier: "phase1",
  phase1SoldCount: 7,
  phase1Remaining: 23,
  phase1Total: EARLYBIRD_CONFIG.phase1.totalSlots,
  phase2SoldCount: 0,
  phase2Remaining: EARLYBIRD_CONFIG.phase2.totalSlots,
  phase2Total: EARLYBIRD_CONFIG.phase2.totalSlots,
  tier1Deadline: EARLYBIRD_CONFIG.phase1.hardDeadline,
};

function clampRemaining(total: number, soldCount: number) {
  return Math.max(0, total - soldCount);
}

async function countCompletedInitialProgramByTier(
  adminClient: ReturnType<typeof createAdminClient>,
  tier: EarlybirdTierKey,
) {
  const { count, error } = await adminClient
    .from("toss_payments")
    .select("order_id", { count: "exact", head: true })
    .eq("status", "DONE")
    .contains("metadata", {
      paymentKind: "initial_program",
      earlybirdTier: tier,
    });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export function resolveEarlybirdTier(summary: Pick<EarlybirdSummary, "phase1SoldCount" | "phase2SoldCount">, now = new Date()): EarlybirdTier {
  const tier1Deadline = new Date(EARLYBIRD_CONFIG.phase1.hardDeadline);
  const beforeTier1Deadline = now.getTime() <= tier1Deadline.getTime();

  if (beforeTier1Deadline && summary.phase1SoldCount < EARLYBIRD_CONFIG.phase1.totalSlots) {
    return "phase1";
  }

  if (summary.phase2SoldCount < EARLYBIRD_CONFIG.phase2.totalSlots) {
    return "phase2";
  }

  return "ended";
}

export async function getEarlybirdSummary(
  adminClient: ReturnType<typeof createAdminClient> = createAdminClient(),
): Promise<EarlybirdSummary> {
  const [phase1SoldCount, phase2SoldCount] = await Promise.all([
    countCompletedInitialProgramByTier(adminClient, "phase1"),
    countCompletedInitialProgramByTier(adminClient, "phase2"),
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
  };

  return summary;
}
