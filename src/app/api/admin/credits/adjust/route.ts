import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, amount, reason } = body;

    if (!email || typeof amount !== "number" || !reason) {
      return NextResponse.json(
        { error: "email, amount, reason are required" },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();

    const { data: targetUser } = await adminClient
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const userPlan = await loadCreditPlanSnapshot(adminClient, targetUser.id);

    if (!userPlan) {
      return NextResponse.json(
        { error: "User plan not found" },
        { status: 404 },
      );
    }

    const previousCredits = userPlan.credits;
    const deductionFromPurchased = amount < 0 ? Math.min(userPlan.purchasedCredits, -amount) : 0;
    const remainingDeduction = amount < 0 ? -amount - deductionFromPurchased : 0;
    const deductionFromSubscription =
      amount < 0 ? Math.min(userPlan.subscriptionCredits, remainingDeduction) : 0;

    const nextPurchasedCredits =
      amount >= 0
        ? userPlan.purchasedCredits + amount
        : userPlan.purchasedCredits - deductionFromPurchased;
    const nextSubscriptionCredits =
      amount >= 0
        ? userPlan.subscriptionCredits
        : userPlan.subscriptionCredits - deductionFromSubscription;

    const updateResult = await updateCreditPlanBalances(adminClient, {
      userId: targetUser.id,
      current: userPlan,
      subscriptionCredits: nextSubscriptionCredits,
      purchasedCredits: nextPurchasedCredits,
      planType: userPlan.planType,
      expiresAt: userPlan.expiresAt,
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { error: "Failed to update credits" },
        { status: 500 },
      );
    }

    const newCredits = updateResult.plan.credits;
    const appliedAdjustment = newCredits - previousCredits;

    if (appliedAdjustment !== 0) {
      await recordCreditTransaction({
        userId: targetUser.id,
        type: appliedAdjustment > 0 ? "manual_add" : "manual_deduct",
        amount: appliedAdjustment,
        balanceAfter: newCredits,
        description: "admin credit adjustment",
        adminNote: reason,
        metadata: {
          adminEmail: user.email,
          requestedAmount: amount,
          purchasedAdjusted:
            amount >= 0 ? amount : -deductionFromPurchased,
          subscriptionAdjusted:
            amount >= 0 ? 0 : -deductionFromSubscription,
        },
      });
    }

    return NextResponse.json({
      success: true,
      email,
      previousCredits,
      newCredits,
      adjustment: appliedAdjustment,
      reason,
    });
  } catch (error) {
    console.error("[Admin Credit Adjust] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 },
    );
  }
}
