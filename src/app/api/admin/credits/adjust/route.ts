/**
 * Admin Credit Adjust API
 * 관리자가 특정 사용자의 크레딧을 수동 조정
 */

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Admin check
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

    if (!email || !amount || !reason) {
      return NextResponse.json(
        { error: "email, amount, reason are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Find user by email
    const { data: targetUser } = await adminClient
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get current credits
    const { data: userPlan } = await adminClient
      .from("user_plans")
      .select("credits")
      .eq("user_id", targetUser.id)
      .single();

    if (!userPlan) {
      return NextResponse.json(
        { error: "User plan not found" },
        { status: 404 }
      );
    }

    const newCredits = Math.max(0, userPlan.credits + amount);

    // Update credits
    const { error: updateError } = await adminClient
      .from("user_plans")
      .update({ credits: newCredits })
      .eq("user_id", targetUser.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      previousCredits: userPlan.credits,
      newCredits,
      adjustment: amount,
      reason,
    });
  } catch (error) {
    console.error("[Admin Credit Adjust] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
