import { NextRequest, NextResponse } from "next/server";

import { recordCreditTransaction } from "@/lib/credits/server";
import { TOSSPAY_PLAN_CONFIG } from "@/lib/tosspay/config";
import { sendPaymentCompleteEmail } from "@/services/email/actions";
import { createAdminClient } from "@/utils/supabase/admin";

type ExistingUserPlanRow = {
  credits: number;
  subscription_credits?: number | null;
  purchased_credits?: number | null;
  monthly_credit_granted_cycles: number | null;
  next_credit_at: string | null;
};

type PaymentRow = {
  user_id: string;
  amount: number;
  status: string;
  metadata?: Record<string, unknown> | null;
};

async function notifyPaymentCompleteByEmail(
  admin: ReturnType<typeof createAdminClient>,
  payment: PaymentRow,
  grantedCredits: number,
) {
  let buyerEmail =
    typeof payment.metadata?.buyerEmail === "string"
      ? payment.metadata.buyerEmail
      : "";

  if (!buyerEmail) {
    const { data, error } = await admin.auth.admin.getUserById(payment.user_id);

    if (error) {
      console.error("[TossPay Callback] Failed to resolve email from auth:", error);
    } else {
      buyerEmail = data.user?.email || "";
    }
  }

  if (!buyerEmail) {
    console.warn("[TossPay Callback] Payment complete email skipped: missing_email");
    return;
  }

  try {
    const result = await sendPaymentCompleteEmail({
      email: buyerEmail,
      userName: buyerEmail.split("@")[0] || "고객님",
      amount: payment.amount,
      grantedCredits,
    });

    if (result.error) {
      console.error("[TossPay Callback] Payment complete email failed:", result.error);
    }
  } catch (error) {
    console.error("[TossPay Callback] Payment complete email failed:", error);
  }
}

function isLegacySchemaError(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42703" || code === "23514";
}

async function applyLegacyProgramCreditsOnly(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  creditsToAdd: number,
): Promise<{ success: true; credits: number } | { success: false; error: unknown }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: currentPlan, error: loadError } = await admin
      .from("user_plans")
      .select("credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (loadError) {
      return { success: false, error: loadError };
    }

    const currentCredits = currentPlan?.credits || 0;
    const nextCredits = currentCredits + creditsToAdd;

    if (!currentPlan) {
      const { data: inserted, error: insertError } = await admin
        .from("user_plans")
        .insert({
          user_id: userId,
          plan_type: "free",
          credits: nextCredits,
        })
        .select("credits")
        .single();

      if (!insertError && inserted) {
        return { success: true, credits: inserted.credits };
      }

      if ((insertError as { code?: string } | null)?.code === "23505") {
        continue;
      }

      return { success: false, error: insertError };
    }

    const { data: updated, error: updateError } = await admin
      .from("user_plans")
      .update({ credits: nextCredits })
      .eq("user_id", userId)
      .eq("credits", currentCredits)
      .select("credits")
      .single();

    if (updated) {
      return { success: true, credits: updated.credits };
    }

    const updateErrorCode = (updateError as { code?: string } | null)?.code;
    if (updateError && updateErrorCode !== "PGRST116") {
      return { success: false, error: updateError };
    }
  }

  return { success: false, error: new Error("concurrent_legacy_credit_update") };
}

async function applyInitialProgramPlan(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  config: (typeof TOSSPAY_PLAN_CONFIG)[keyof typeof TOSSPAY_PLAN_CONFIG],
  expiresAtIso: string,
  nextCreditAtIso: string,
): Promise<{ success: true; credits: number } | { success: false; error: unknown }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: currentPlan, error: loadError } = await admin
      .from("user_plans")
      .select(
        "credits, subscription_credits, purchased_credits, monthly_credit_granted_cycles, next_credit_at",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (loadError) {
      return { success: false, error: loadError };
    }

    const planRow = currentPlan as ExistingUserPlanRow | null;
    const nextSubscriptionCredits = config.initialCredits;
    const nextPurchasedCredits = planRow?.purchased_credits || 0;
    const nextCredits = nextSubscriptionCredits + nextPurchasedCredits;

    if (!planRow) {
      const { data: inserted, error: insertError } = await admin
        .from("user_plans")
        .insert({
          user_id: userId,
          plan_type: config.userPlanType,
          credits: nextCredits,
          subscription_credits: nextSubscriptionCredits,
          purchased_credits: nextPurchasedCredits,
          expires_at: expiresAtIso,
          monthly_credit_amount: config.monthlyCredits,
          monthly_credit_total_cycles: config.months,
          monthly_credit_granted_cycles: 1,
          next_credit_at: nextCreditAtIso,
        })
        .select("credits")
        .single();

      if (!insertError && inserted) {
        return { success: true, credits: inserted.credits };
      }

      if ((insertError as { code?: string } | null)?.code === "23505") {
        continue;
      }

      return { success: false, error: insertError };
    }

    let updateQuery = admin
      .from("user_plans")
      .update({
        plan_type: config.userPlanType,
        credits: nextCredits,
        subscription_credits: nextSubscriptionCredits,
        purchased_credits: nextPurchasedCredits,
        expires_at: expiresAtIso,
        monthly_credit_amount: config.monthlyCredits,
        monthly_credit_total_cycles: config.months,
        monthly_credit_granted_cycles: 1,
        next_credit_at: nextCreditAtIso,
      })
      .eq("user_id", userId)
      .eq("credits", planRow.credits)
      .eq("subscription_credits", planRow.subscription_credits ?? 0)
      .eq("purchased_credits", planRow.purchased_credits ?? 0);

    updateQuery =
      planRow.monthly_credit_granted_cycles === null
        ? updateQuery.is("monthly_credit_granted_cycles", null)
        : updateQuery.eq(
            "monthly_credit_granted_cycles",
            planRow.monthly_credit_granted_cycles,
          );

    updateQuery = planRow.next_credit_at
      ? updateQuery.eq("next_credit_at", planRow.next_credit_at)
      : updateQuery.is("next_credit_at", null);

    const { data: updated, error: updateError } = await updateQuery
      .select("credits")
      .single();

    if (updated) {
      return { success: true, credits: updated.credits };
    }

    const updateErrorCode = (updateError as { code?: string } | null)?.code;
    if (updateError && updateErrorCode !== "PGRST116") {
      return { success: false, error: updateError };
    }
  }

  return { success: false, error: new Error("concurrent_plan_update") };
}

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
    const config =
      TOSSPAY_PLAN_CONFIG[planType as keyof typeof TOSSPAY_PLAN_CONFIG];

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
      console.error(
        "[TossPay Callback] Failed to acquire processing lock:",
        processingError,
      );
      return NextResponse.json({ code: 0 });
    }

    if (!processingRows?.length) {
      return NextResponse.json({ code: 0 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + config.months);

    const nextCreditAt = new Date();
    nextCreditAt.setMonth(nextCreditAt.getMonth() + 1);

    const planGrantResult = await applyInitialProgramPlan(
      admin,
      payment.user_id,
      config,
      expiresAt.toISOString(),
      nextCreditAt.toISOString(),
    );

    if (!planGrantResult.success) {
      console.error("[TossPay Callback] Plan grant failed:", planGrantResult.error);

      if (isLegacySchemaError(planGrantResult.error)) {
        const legacyGrantResult = await applyLegacyProgramCreditsOnly(
          admin,
          payment.user_id,
          config.initialCredits,
        );

        if (legacyGrantResult.success) {
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
                fallbackMode: "legacy_schema",
                accessExpiresAt: expiresAt.toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderNo);

          await recordCreditTransaction({
            userId: payment.user_id,
            type: "charge",
            amount: config.initialCredits,
            balanceAfter: legacyGrantResult.credits,
            description: `initial program payment (legacy fallback): ${config.name}`,
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
              subscriptionGranted: config.initialCredits,
              purchasedGranted: 0,
              fallbackMode: "legacy_schema",
            },
          });

          await notifyPaymentCompleteByEmail(
            admin,
            payment as PaymentRow,
            config.initialCredits,
          );

          console.warn("[TossPay Callback] Completed with legacy schema fallback:", {
            orderNo,
            planType,
            credits: legacyGrantResult.credits,
          });

          return NextResponse.json({ code: 0 });
        }

        console.error(
          "[TossPay Callback] Legacy fallback failed:",
          legacyGrantResult.error,
        );
      }

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

    const newCredits = planGrantResult.credits;

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
        subscriptionGranted: config.initialCredits,
        purchasedGranted: 0,
      },
    });

    await notifyPaymentCompleteByEmail(admin, payment as PaymentRow, config.initialCredits);

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
