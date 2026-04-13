import { NextRequest, NextResponse } from "next/server";

import { recordCreditTransaction } from "@/lib/credits/server";
import { createAdminClient } from "@/utils/supabase/admin";

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn("[Cron] CRON_SECRET not set - rejecting request");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

function addOneMonth(base: Date) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + 1);
  return next;
}

type DuePlanRow = {
  user_id: string;
  credits: number;
  plan_type: string;
  expires_at: string | null;
  monthly_credit_amount: number;
  monthly_credit_total_cycles: number | null;
  monthly_credit_granted_cycles: number;
  next_credit_at: string | null;
};

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  try {
    const { data: rows, error } = await admin
      .from("user_plans")
      .select(
        "user_id, credits, plan_type, expires_at, monthly_credit_amount, monthly_credit_total_cycles, monthly_credit_granted_cycles, next_credit_at",
      )
      .gt("monthly_credit_amount", 0)
      .not("next_credit_at", "is", null)
      .lte("next_credit_at", now.toISOString());

    if (error) {
      if ((error as { code?: string }).code === "42703") {
        console.warn("[Cron] Monthly credit fields missing - skipping until migration is applied");
        return NextResponse.json({
          success: true,
          checked: 0,
          granted: 0,
          skipped: 0,
          failures: [],
          migrationPending: true,
        });
      }
      console.error("[Cron] Failed to load due plans:", error);
      return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
    }

    let granted = 0;
    let skipped = 0;
    const failures: Array<{ userId: string; reason: string }> = [];

    for (const plan of (rows || []) as DuePlanRow[]) {
      if (!plan.next_credit_at || plan.monthly_credit_amount <= 0) {
        skipped += 1;
        continue;
      }

      if (
        plan.monthly_credit_total_cycles !== null &&
        plan.monthly_credit_granted_cycles >= plan.monthly_credit_total_cycles
      ) {
        skipped += 1;
        continue;
      }

      if (plan.expires_at && new Date(plan.expires_at) < now) {
        skipped += 1;
        continue;
      }

      const newCredits = plan.credits + plan.monthly_credit_amount;
      const newGrantedCycles = plan.monthly_credit_granted_cycles + 1;
      const hasMoreCycles =
        plan.monthly_credit_total_cycles === null ||
        newGrantedCycles < plan.monthly_credit_total_cycles;
      const nextCreditAt = hasMoreCycles ? addOneMonth(new Date(plan.next_credit_at)) : null;

      const { data: updated, error: updateError } = await admin
        .from("user_plans")
        .update({
          credits: newCredits,
          monthly_credit_granted_cycles: newGrantedCycles,
          next_credit_at: nextCreditAt?.toISOString() ?? null,
        })
        .eq("user_id", plan.user_id)
        .eq("credits", plan.credits)
        .eq("monthly_credit_granted_cycles", plan.monthly_credit_granted_cycles)
        .eq("next_credit_at", plan.next_credit_at)
        .select("credits")
        .single();

      if (updateError || !updated) {
        failures.push({
          userId: plan.user_id,
          reason: updateError?.message || "concurrent_update",
        });
        continue;
      }

      await recordCreditTransaction({
        userId: plan.user_id,
        type: "manual_add",
        amount: plan.monthly_credit_amount,
        balanceAfter: updated.credits,
        description: `monthly credit grant: ${plan.plan_type}`,
        referenceId: `monthly_credit:${plan.user_id}:${newGrantedCycles}`,
        metadata: {
          planType: plan.plan_type,
          grantCycle: newGrantedCycles,
          totalCycles: plan.monthly_credit_total_cycles,
        },
      });

      granted += 1;
    }

    return NextResponse.json({
      success: true,
      checked: rows?.length || 0,
      granted,
      skipped,
      failures,
    });
  } catch (err) {
    console.error("[Cron] Monthly credit grant failed:", err);
    return NextResponse.json({ error: "Grant failed" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
