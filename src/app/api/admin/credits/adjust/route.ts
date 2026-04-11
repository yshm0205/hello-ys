import { NextRequest, NextResponse } from "next/server";

import { recordCreditTransaction } from "@/lib/credits/server";
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

    const { data: userPlan } = await adminClient
      .from("user_plans")
      .select("credits")
      .eq("user_id", targetUser.id)
      .single();

    if (!userPlan) {
      return NextResponse.json(
        { error: "User plan not found" },
        { status: 404 },
      );
    }

    const previousCredits = userPlan.credits;
    const newCredits = Math.max(0, previousCredits + amount);
    const appliedAdjustment = newCredits - previousCredits;

    const { error: updateError } = await adminClient
      .from("user_plans")
      .update({ credits: newCredits })
      .eq("user_id", targetUser.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update credits" },
        { status: 500 },
      );
    }

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
