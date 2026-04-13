import { NextRequest, NextResponse } from "next/server";

import { recordCreditTransaction } from "@/lib/credits/server";
import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * TossPay V2 callback.
 * autoExecute=true, so TossPay calls this endpoint after payment completes.
 */
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

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + config.months);

    const { data: plan } = await admin
      .from("user_plans")
      .select("credits")
      .eq("user_id", payment.user_id)
      .single();

    const currentCredits = plan?.credits || 0;
    const newCredits = currentCredits + config.credits;
    let creditGrantMode: "full" | "credits_only" = "full";

    const { error: planUpdateError } = await admin
      .from("user_plans")
      .update({
        plan_type: planType,
        credits: newCredits,
        expires_at: expiresAt.toISOString(),
      })
      .eq("user_id", payment.user_id);

    if (planUpdateError) {
      console.warn("[TossPay Callback] Full plan update failed, retrying credits-only:", planUpdateError);

      const { error: creditOnlyError } = await admin
        .from("user_plans")
        .update({
          credits: newCredits,
        })
        .eq("user_id", payment.user_id);

      if (creditOnlyError) {
        console.error("[TossPay Callback] Credits-only fallback failed:", creditOnlyError);
        await admin
          .from("toss_payments")
          .update({
            status: "CREDIT_GRANT_FAILED",
            payment_key: payToken,
            credits: config.credits,
            metadata: {
              ...(payment.metadata || {}),
              payToken,
              planType,
              creditGrantMode: "failed",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", orderNo);
        return NextResponse.json({ code: 0 });
      }

      creditGrantMode = "credits_only";
    }

    await admin
      .from("toss_payments")
      .update({
        status: "DONE",
        payment_key: payToken,
        credits: config.credits,
        metadata: {
          ...(payment.metadata || {}),
          payToken,
          planType,
          creditGrantMode,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderNo);

    await recordCreditTransaction({
      userId: payment.user_id,
      type: "charge",
      amount: config.credits,
      balanceAfter: newCredits,
      description: `tosspay charge: ${planType} (${config.months} months)`,
      referenceId: orderNo,
      metadata: { provider: "tosspay", planType, payToken, amount },
    });

    console.log("[TossPay Callback] Success:", {
      orderNo,
      planType,
      credits: config.credits,
    });

    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("[TossPay Callback] Error:", error);
    return NextResponse.json({ code: 0 });
  }
}
