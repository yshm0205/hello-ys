import { NextRequest, NextResponse } from "next/server";

import { recordCreditTransaction } from "@/lib/credits/server";
import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderNo, payToken, status, amount } = body as {
      orderNo?: string;
      payToken?: string;
      status?: string;
      amount?: number;
    };

    console.log("[TossPay Callback]", JSON.stringify(body));

    if (!orderNo) {
      return NextResponse.json({ code: 0 });
    }

    const admin = createAdminClient();
    const { data: payment } = await admin
      .from("toss_payments")
      .select("*")
      .eq("order_id", orderNo)
      .single();

    if (!payment) {
      console.error("[TossPay Callback] Order not found:", orderNo);
      return NextResponse.json({ code: 0 });
    }

    if (payment.status === "DONE") {
      return NextResponse.json({ code: 0 });
    }

    if (status !== "PAY_COMPLETE") {
      await admin
        .from("toss_payments")
        .update({
          status: status || "FAILED",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderNo);

      return NextResponse.json({ code: 0 });
    }

    if (amount !== payment.amount) {
      console.error("[TossPay Callback] Amount mismatch:", {
        expected: payment.amount,
        got: amount,
      });

      await admin
        .from("toss_payments")
        .update({ status: "AMOUNT_MISMATCH" })
        .eq("order_id", orderNo);

      return NextResponse.json({ code: 0 });
    }

    const planType =
      typeof payment.metadata?.planType === "string"
        ? payment.metadata.planType
        : "allinone";
    const config = TOSSPAY_PLAN_CONFIG[planType as keyof typeof TOSSPAY_PLAN_CONFIG];

    if (!config) {
      console.error("[TossPay Callback] Unknown plan:", planType);
      await admin
        .from("toss_payments")
        .update({ status: "UNKNOWN_PLAN" })
        .eq("order_id", orderNo);
      return NextResponse.json({ code: 0 });
    }

    const { data: processingRows, error: processingError } = await admin
      .from("toss_payments")
      .update({
        status: "PROCESSING",
        payment_key: payToken,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderNo)
      .in("status", ["PENDING", "PAY_PENDING", "IN_PROGRESS", "CREDIT_GRANT_FAILED"])
      .select("order_id");

    if (processingError) {
      console.error("[TossPay Callback] Failed to acquire processing lock:", processingError);
      return NextResponse.json({ code: 0 });
    }

    if (!processingRows?.length) {
      return NextResponse.json({ code: 0 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + config.months);

    const nextCreditAt = new Date();
    nextCreditAt.setMonth(nextCreditAt.getMonth() + 1);

    const { data: currentPlan } = await admin
      .from("user_plans")
      .select("credits")
      .eq("user_id", payment.user_id)
      .maybeSingle();

    const currentCredits = currentPlan?.credits || 0;
    const newCredits = currentCredits + config.initialCredits;

    const { error: planUpsertError } = await admin
      .from("user_plans")
      .upsert(
        {
          user_id: payment.user_id,
          plan_type: config.userPlanType,
          credits: newCredits,
          expires_at: expiresAt.toISOString(),
          monthly_credit_amount: config.monthlyCredits,
          monthly_credit_total_cycles: config.months,
          monthly_credit_granted_cycles: 1,
          next_credit_at: nextCreditAt.toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (planUpsertError) {
      console.error("[TossPay Callback] Plan upsert failed:", planUpsertError);
      await admin
        .from("toss_payments")
        .update({
          status: "CREDIT_GRANT_FAILED",
          payment_key: payToken,
          credits: config.initialCredits,
          metadata: {
            ...(payment.metadata || {}),
            payToken,
            planType,
            userPlanType: config.userPlanType,
            paymentKind: config.paymentKind,
            initialCredits: config.initialCredits,
            monthlyCredits: config.monthlyCredits,
            months: config.months,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderNo);
      return NextResponse.json({ code: 0 });
    }

    await admin
      .from("toss_payments")
      .update({
        status: "DONE",
        payment_key: payToken,
        credits: config.initialCredits,
        metadata: {
          ...(payment.metadata || {}),
          payToken,
          planType,
          userPlanType: config.userPlanType,
          paymentKind: config.paymentKind,
          initialCredits: config.initialCredits,
          monthlyCredits: config.monthlyCredits,
          months: config.months,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderNo);

    await recordCreditTransaction({
      userId: payment.user_id,
      type: "charge",
      amount: config.initialCredits,
      balanceAfter: newCredits,
      description: `initial program payment: ${config.name}`,
      referenceId: orderNo,
      metadata: {
        provider: "tosspay",
        planType,
        userPlanType: config.userPlanType,
        paymentKind: config.paymentKind,
        payToken,
        amount,
        initialCredits: config.initialCredits,
        monthlyCredits: config.monthlyCredits,
      },
    });

    console.log("[TossPay Callback] Success:", {
      orderNo,
      planType,
      userPlanType: config.userPlanType,
      initialCredits: config.initialCredits,
    });

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("[TossPay Callback] Error:", error);
    return NextResponse.json({ code: 0 });
  }
}
