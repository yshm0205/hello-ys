import { createHash, timingSafeEqual } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  loadCreditPlanSnapshot,
  recordCreditTransaction,
  updateCreditPlanBalances,
} from "@/lib/credits/server";
import { buildGrantSnapshotMetadata } from "@/lib/payments/grant-snapshot";
import { isActiveAccessPlan, TOSSPAY_PLAN_CONFIG } from "@/lib/plans/config";
import { notifyTelegramPaymentCompleted } from "@/lib/telegram/payments";
import { sendPaymentCompleteEmail } from "@/services/email/actions";
import { createAdminClient } from "@/utils/supabase/admin";

type LatpeedPaymentStatus = "SUCCESS" | "CANCEL";
type LatpeedWebhookType = "NORMAL_PAYMENT" | "MEMBERSHIP_PAYMENT";

type LatpeedFormAnswer = {
  question?: unknown;
  answer?: unknown;
};

type LatpeedPayment = {
  name?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  amount?: unknown;
  status?: unknown;
  date?: unknown;
  method?: unknown;
  canceledReason?: unknown;
  option?: unknown;
  orderId?: unknown;
  forms?: unknown;
  agreements?: unknown;
};

type LatpeedWebhookPayload = {
  type?: unknown;
  payment?: LatpeedPayment;
};

type PaymentRow = {
  id?: string;
  user_id: string;
  order_id: string;
  order_name: string | null;
  amount: number;
  credits: number;
  status: string;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
};

const PLAN_TYPE = "allinone";
const PROVIDER = "latpeed";
const EVENT_TABLE = "latpeed_webhook_events";
const INTENT_TABLE = "latpeed_payment_intents";

type LatpeedPaymentIntentRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  amount: number;
  status: string;
  created_at: string;
  expires_at: string;
  metadata?: Record<string, unknown> | null;
};

function timingSafeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

function verifySecret(request: NextRequest) {
  const expected =
    process.env.LATPEED_WEBHOOK_SECRET?.trim() || process.env.API_SECRET_KEY?.trim() || "";
  if (!expected) {
    return { ok: false as const, status: 500, error: "Webhook secret is not configured" };
  }

  const provided =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-latpeed-secret") ||
    "";

  if (!provided || !timingSafeEquals(provided, expected)) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  return { ok: true as const };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  const email = readString(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function readAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }

  return 0;
}

function readForms(payment: LatpeedPayment): LatpeedFormAnswer[] {
  return Array.isArray(payment.forms) ? (payment.forms as LatpeedFormAnswer[]) : [];
}

function extractSignupEmail(payment: LatpeedPayment) {
  const forms = readForms(payment);
  const candidates = forms
    .map((form) => ({
      question: readString(form.question),
      email: normalizeEmail(form.answer),
    }))
    .filter((candidate) => candidate.email);

  const priority = candidates.find((candidate) => {
    const question = candidate.question.toLowerCase();
    return (
      question.includes("flowspot") ||
      question.includes("플로우스팟") ||
      question.includes("가입") ||
      question.includes("계정") ||
      question.includes("이메일") ||
      question.includes("email")
    );
  });

  if (priority) {
    return { email: priority.email, source: "forms" as const };
  }

  if (candidates[0]) {
    return { email: candidates[0].email, source: "forms" as const };
  }

  return { email: normalizeEmail(payment.email), source: "buyer_email" as const };
}

function toIsoDate(value: unknown) {
  const raw = readString(value);
  const date = raw ? new Date(raw) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function addMonths(base: Date, months: number) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function buildHash(input: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function buildRawEventKey(reason: string, payload: unknown) {
  const hash = buildHash({
    reason,
    payload,
    receivedAtBucket: new Date().toISOString().slice(0, 16),
  });

  return `latpeed_raw_${hash.slice(0, 48)}`;
}

function buildEventIdentity(
  type: LatpeedWebhookType,
  paymentStatus: LatpeedPaymentStatus,
  payment: LatpeedPayment,
  signupEmail: string,
) {
  const latpeedOrderId = readString(payment.orderId);
  if (latpeedOrderId) {
    const statusKey = paymentStatus.toLowerCase();
    const orderHash = buildHash({ orderId: latpeedOrderId }).slice(0, 48);
    return {
      eventKey: `latpeed_${statusKey}_${orderHash}`,
      orderId: latpeedOrderId,
    };
  }

  const hash = buildHash({
    type,
    status: paymentStatus,
    signupEmail,
    buyerEmail: normalizeEmail(payment.email),
    phoneNumber: readString(payment.phoneNumber),
    amount: readAmount(payment.amount),
    date: readString(payment.date),
    option: readString(payment.option),
  });

  return {
    eventKey: `latpeed_${hash.slice(0, 48)}`,
    orderId: `latpeed_${hash.slice(0, 32)}`,
  };
}

function isMissingEventTable(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "PGRST205" || code === "PGRST204";
}

async function tryInsertEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    eventKey: string;
    type: LatpeedWebhookType;
    paymentStatus: LatpeedPaymentStatus;
    signupEmail: string;
    amount: number;
    payload: LatpeedWebhookPayload;
  },
) {
  const { error } = await admin.from(EVENT_TABLE).insert({
    event_key: input.eventKey,
    event_type: input.type,
    payment_status: input.paymentStatus,
    signup_email: input.signupEmail || null,
    amount: input.amount,
    payload: input.payload,
    status: "received",
  });

  if (!error) return { ok: true as const, duplicate: false };

  const code = (error as { code?: string } | null)?.code;
  if (code === "23505") {
    return { ok: true as const, duplicate: true };
  }

  if (isMissingEventTable(error)) {
    console.warn("[Latpeed Webhook] event table missing; continuing without event lock");
    return { ok: true as const, duplicate: false, tableMissing: true };
  }

  console.error("[Latpeed Webhook] event insert failed:", error);
  return { ok: false as const, error };
}

async function tryInsertRawEvent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    reason: string;
    payload: unknown;
    eventType?: string;
    paymentStatus?: string;
    signupEmail?: string;
    amount?: number;
  },
) {
  const safePayload =
    input.payload && typeof input.payload === "object"
      ? (input.payload as Record<string, unknown>)
      : { raw: input.payload ?? null };

  const { error } = await admin.from(EVENT_TABLE).insert({
    event_key: buildRawEventKey(input.reason, safePayload),
    event_type: input.eventType || "UNKNOWN",
    payment_status: input.paymentStatus || "UNKNOWN",
    signup_email: input.signupEmail || null,
    amount: Number.isFinite(input.amount) ? input.amount : null,
    payload: safePayload,
    status: "failed",
    error_message: input.reason,
    processed_at: new Date().toISOString(),
  });

  if (error && (error as { code?: string }).code !== "23505" && !isMissingEventTable(error)) {
    console.error("[Latpeed Webhook] raw event insert failed:", error);
  }
}

async function updateEventStatus(
  admin: ReturnType<typeof createAdminClient>,
  eventKey: string,
  status: "processed" | "failed" | "duplicate",
  errorMessage?: string,
  userId?: string,
) {
  const { error } = await admin
    .from(EVENT_TABLE)
    .update({
      status,
      error_message: errorMessage || null,
      user_id: userId || null,
      processed_at: new Date().toISOString(),
    })
    .eq("event_key", eventKey);

  if (error && !isMissingEventTable(error)) {
    console.error("[Latpeed Webhook] event status update failed:", error);
  }
}

async function findUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    console.error("[Latpeed Webhook] user lookup failed:", error);
    return null;
  }

  return data as { id: string; email: string; full_name: string | null } | null;
}

async function findUserById(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data, error } = await admin
    .from("users")
    .select("id, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Latpeed Webhook] user lookup by id failed:", error);
    return null;
  }

  return data as { id: string; email: string; full_name: string | null } | null;
}

async function findMatchingIntent(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    signupEmail: string;
    amount: number;
    paidAt: string;
  },
) {
  const { data, error } = await admin
    .from(INTENT_TABLE)
    .select("id, user_id, user_email, user_name, amount, status, created_at, expires_at, metadata")
    .eq("status", "pending")
    .eq("amount", input.amount)
    .ilike("user_email", input.signupEmail)
    .lte("created_at", input.paidAt)
    .gte("expires_at", input.paidAt)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    if (!isMissingEventTable(error)) {
      console.error("[Latpeed Webhook] intent lookup failed:", error);
    }
    return null;
  }

  return ((data || [])[0] || null) as LatpeedPaymentIntentRow | null;
}

async function updateIntentStatus(
  admin: ReturnType<typeof createAdminClient>,
  intent: LatpeedPaymentIntentRow | null,
  input: {
    status: "matched" | "manual_review";
    eventKey: string;
    payment: LatpeedPayment;
    paidAt: string;
    reason?: string;
  },
) {
  if (!intent) return;

  const { error } = await admin
    .from(INTENT_TABLE)
    .update({
      status: input.status,
      latpeed_event_key: input.eventKey,
      payment_email: normalizeEmail(input.payment.email),
      payment_name: readString(input.payment.name) || null,
      payment_phone: readString(input.payment.phoneNumber) || null,
      payment_date: input.paidAt,
      matched_at: new Date().toISOString(),
      metadata: {
        ...(intent.metadata || {}),
        matchStatus: input.status,
        matchReason: input.reason || null,
      },
    })
    .eq("id", intent.id)
    .eq("status", "pending");

  if (error && !isMissingEventTable(error)) {
    console.error("[Latpeed Webhook] intent status update failed:", error);
  }
}

async function notifyPaymentComplete(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    userId: string;
    email: string;
    name: string;
    amount: number;
    grantedCredits: number;
    orderId: string;
    paidAt: string;
  },
) {
  await Promise.allSettled([
    sendPaymentCompleteEmail({
      email: input.email,
      userName: input.name || input.email.split("@")[0] || "고객",
      amount: input.amount,
      grantedCredits: input.grantedCredits,
    }),
    notifyTelegramPaymentCompleted({
      userId: input.userId,
      email: input.email,
      name: input.name,
      amount: input.amount,
      grantedCredits: input.grantedCredits,
      orderId: input.orderId,
      orderName: "FlowSpot 올인원 패스",
      paymentKind: "initial_program",
      provider: PROVIDER,
      paymentId: input.orderId,
      planType: PLAN_TYPE,
      paidAt: input.paidAt,
    }),
  ]);

  // Keep `admin` in the signature aligned with other payment notifiers.
  void admin;
}

async function handleSuccess(input: {
  admin: ReturnType<typeof createAdminClient>;
  payload: LatpeedWebhookPayload;
  payment: LatpeedPayment;
  eventKey: string;
  orderId: string;
  signupEmail: string;
  signupEmailSource: "forms" | "buyer_email";
  amount: number;
  paidAt: string;
}) {
  const { admin, payment, payload, eventKey, orderId, signupEmail, amount, paidAt } = input;
  const config = TOSSPAY_PLAN_CONFIG.allinone;

  if (amount !== config.amount) {
    await updateEventStatus(admin, eventKey, "failed", `amount_mismatch:${amount}`);
    return { ok: true, status: "amount_mismatch" };
  }

  const { data: existing } = await admin
    .from("toss_payments")
    .select("id, status")
    .eq("payment_key", eventKey)
    .maybeSingle();

  if (existing) {
    await updateEventStatus(admin, eventKey, "duplicate");
    return { ok: true, status: "duplicate" };
  }

  const latpeedOrderId = readString(payment.orderId);
  if (latpeedOrderId) {
    const { data: existingByOrderId } = await admin
      .from("toss_payments")
      .select("id, status, metadata")
      .eq("order_id", latpeedOrderId)
      .limit(10);

    const duplicatedOrder = (existingByOrderId || []).find(
      (row: { metadata?: Record<string, unknown> | null }) => row.metadata?.provider === PROVIDER,
    );

    if (duplicatedOrder) {
      await updateEventStatus(admin, eventKey, "duplicate");
      return { ok: true, status: "duplicate" };
    }
  }

  const matchingIntent = await findMatchingIntent(admin, {
    signupEmail,
    amount,
    paidAt,
  });
  let user = matchingIntent ? await findUserById(admin, matchingIntent.user_id) : null;

  if (!user) {
    user = await findUserByEmail(admin, signupEmail);
  }

  if (!user) {
    await updateEventStatus(admin, eventKey, "failed", "user_not_found");
    console.warn("[Latpeed Webhook] user not found:", signupEmail);
    return { ok: true, status: "user_not_found" };
  }

  const currentPlan = await loadCreditPlanSnapshot(admin, user.id);
  const hasActiveAccess = isActiveAccessPlan(currentPlan?.planType, currentPlan?.expiresAt);
  const hasMatchedIntent = Boolean(matchingIntent && matchingIntent.user_id === user.id);
  const manualReviewReason = hasActiveAccess
    ? "active_access_plan_exists"
    : hasMatchedIntent
      ? null
      : "latpeed_intent_not_found";
  const grantSnapshot = buildGrantSnapshotMetadata({
    paymentKind: "initial_program",
    chargedAmount: amount,
    grantedSubscriptionCredits: config.initialCredits,
    grantedPurchasedCredits: 0,
    planType: PLAN_TYPE,
    userPlanType: config.userPlanType,
    monthlyCredits: config.monthlyCredits,
    months: config.months,
    earlybirdTier: null,
  });

  const metadata = {
    provider: PROVIDER,
    pgProvider: PROVIDER,
    paymentKind: config.paymentKind,
    planType: PLAN_TYPE,
    userPlanType: config.userPlanType,
    buyerEmail: normalizeEmail(payment.email),
    buyerName: readString(payment.name),
    buyerPhoneNumber: readString(payment.phoneNumber),
    latpeedSignupEmail: signupEmail,
    latpeedSignupEmailSource: input.signupEmailSource,
    latpeedPaymentStatus: "SUCCESS",
    latpeedPaymentDate: readString(payment.date),
    latpeedMethod: readString(payment.method),
    latpeedOption: readString(payment.option),
    latpeedOrderId,
    latpeedEventKey: eventKey,
    latpeedPayload: payload,
    latpeedIntentMatched: hasMatchedIntent,
    latpeedIntentId: matchingIntent?.id || null,
    latpeedIntentCreatedAt: matchingIntent?.created_at || null,
    latpeedIntentExpiresAt: matchingIntent?.expires_at || null,
    flowspotUserName: user.full_name,
    manualReviewReason,
    ...grantSnapshot,
  };

  const { error: insertError } = await admin.from("toss_payments").insert({
    user_id: user.id,
    payment_key: eventKey,
    order_id: orderId,
    order_name: "FlowSpot 올인원 패스 (Latpeed)",
    amount,
    credits: manualReviewReason ? 0 : config.initialCredits,
    status: manualReviewReason ? "MANUAL_REVIEW" : "PROCESSING",
    metadata: manualReviewReason
      ? {
          ...metadata,
          manualReviewRequired: true,
          manualReviewReason,
          currentPlanType: currentPlan?.planType || null,
          currentPlanExpiresAt: currentPlan?.expiresAt || null,
        }
      : metadata,
  });

  if (insertError) {
    console.error("[Latpeed Webhook] payment row insert failed:", insertError);
    await updateEventStatus(admin, eventKey, "failed", "payment_insert_failed", user.id);
    return { ok: true, status: "payment_insert_failed" };
  }

  if (!hasMatchedIntent) {
    await updateEventStatus(admin, eventKey, "failed", "latpeed_intent_not_found", user.id);
    return { ok: true, status: "manual_review_missing_intent" };
  }

  if (hasActiveAccess) {
    await updateIntentStatus(admin, matchingIntent, {
      status: "manual_review",
      eventKey,
      payment,
      paidAt,
      reason: "active_access_plan_exists",
    });
    await updateEventStatus(admin, eventKey, "failed", "active_access_plan_exists", user.id);
    return { ok: true, status: "manual_review_active_plan" };
  }

  const expiresAt = addMonths(new Date(paidAt), config.months).toISOString();
  const nextCreditAt = addMonths(new Date(paidAt), 1).toISOString();
  const updateResult = await updateCreditPlanBalances(admin, {
    userId: user.id,
    current: currentPlan,
    subscriptionCredits: config.initialCredits,
    purchasedCredits: currentPlan?.purchasedCredits || 0,
    planType: config.userPlanType,
    expiresAt,
    extra: {
      monthly_credit_amount: config.monthlyCredits,
      monthly_credit_total_cycles: config.months,
      monthly_credit_granted_cycles: 1,
      next_credit_at: nextCreditAt,
    },
  });

  if (!updateResult.success) {
    console.error("[Latpeed Webhook] plan grant failed:", updateResult.error);
    await admin
      .from("toss_payments")
      .update({
        status: "CREDIT_GRANT_FAILED",
        metadata: {
          ...metadata,
          grantError: String((updateResult.error as { message?: string })?.message || updateResult.error),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", eventKey);
    await updateEventStatus(admin, eventKey, "failed", "credit_grant_failed", user.id);
    return { ok: true, status: "credit_grant_failed" };
  }

  await admin
    .from("toss_payments")
    .update({
      status: "DONE",
      credits: config.initialCredits,
      metadata: {
        ...metadata,
        accessExpiresAt: expiresAt,
        nextCreditAt,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", eventKey);

  await updateIntentStatus(admin, matchingIntent, {
    status: "matched",
    eventKey,
    payment,
    paidAt,
  });

  await recordCreditTransaction({
    userId: user.id,
    type: "charge",
    amount: config.initialCredits,
    balanceAfter: updateResult.plan.credits,
    eventType: "purchase",
    action: "latpeed_initial_program_payment",
    subscriptionCreditsDelta: config.initialCredits,
    purchasedCreditsDelta: 0,
    subscriptionCreditsBalance: updateResult.plan.subscriptionCredits,
    purchasedCreditsBalance: updateResult.plan.purchasedCredits,
    description: "latpeed initial program payment",
    referenceId: orderId,
    metadata: {
      provider: PROVIDER,
      paymentKind: config.paymentKind,
      planType: PLAN_TYPE,
      userPlanType: config.userPlanType,
      amount,
      latpeedEventKey: eventKey,
      grantedSubscriptionCredits: config.initialCredits,
      grantedPurchasedCredits: 0,
      grantedTotalCredits: config.initialCredits,
      monthlyCredits: config.monthlyCredits,
      months: config.months,
    },
  });

  await notifyPaymentComplete(admin, {
    userId: user.id,
    email: user.email || signupEmail,
    name: user.full_name || readString(payment.name),
    amount,
    grantedCredits: config.initialCredits,
    orderId,
    paidAt,
  });

  await updateEventStatus(admin, eventKey, "processed", undefined, user.id);
  return { ok: true, status: "processed" };
}

async function findOriginalLatpeedPayment(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  amount: number,
  orderId?: string,
) {
  const { data, error } = await admin
    .from("toss_payments")
    .select("id, user_id, order_id, order_name, amount, credits, status, payment_key, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[Latpeed Webhook] original payment lookup failed:", error);
    return null;
  }

  const rows = ((data || []) as PaymentRow[]).filter(
    (row) =>
      row.status === "DONE" &&
      row.metadata?.provider === PROVIDER &&
      row.metadata?.paymentKind === "initial_program" &&
      row.amount === amount,
  );

  if (orderId) {
    const byOrderId = rows.find(
      (row) => row.order_id === orderId || row.metadata?.latpeedOrderId === orderId,
    );
    if (byOrderId) return byOrderId;
  }

  return rows[0] || null;
}

async function handleCancel(input: {
  admin: ReturnType<typeof createAdminClient>;
  payload: LatpeedWebhookPayload;
  payment: LatpeedPayment;
  eventKey: string;
  orderId: string;
  signupEmail: string;
  amount: number;
}) {
  const { admin, payment, payload, eventKey, orderId, signupEmail, amount } = input;
  const user = await findUserByEmail(admin, signupEmail);

  if (!user) {
    await updateEventStatus(admin, eventKey, "failed", "user_not_found");
    console.warn("[Latpeed Webhook] cancel user not found:", signupEmail);
    return { ok: true, status: "user_not_found" };
  }

  const originalPayment = await findOriginalLatpeedPayment(admin, user.id, amount, orderId);
  if (!originalPayment?.payment_key) {
    await updateEventStatus(admin, eventKey, "failed", "original_payment_not_found", user.id);
    return { ok: true, status: "original_payment_not_found" };
  }

  if (originalPayment.metadata?.latpeedCancelEventKey === eventKey) {
    await updateEventStatus(admin, eventKey, "duplicate", undefined, user.id);
    return { ok: true, status: "duplicate" };
  }

  const { data: lockRows, error: lockError } = await admin
    .from("toss_payments")
    .update({
      status: "CANCELLATION_PROCESSING",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", originalPayment.payment_key)
    .eq("status", "DONE")
    .select("order_id");

  if (lockError || !lockRows?.length) {
    await updateEventStatus(admin, eventKey, "duplicate", undefined, user.id);
    return { ok: true, status: "already_processing_or_cancelled" };
  }

  const currentPlan = await loadCreditPlanSnapshot(admin, user.id);
  const revokedSubscriptionCredits = currentPlan?.subscriptionCredits || 0;
  const purchasedCredits = currentPlan?.purchasedCredits || 0;
  const grantedPurchasedCredits =
    typeof originalPayment.metadata?.grantedPurchasedCredits === "number"
      ? originalPayment.metadata.grantedPurchasedCredits
      : 0;
  const revokedPurchasedCredits = Math.min(purchasedCredits, grantedPurchasedCredits);
  const remainingShortfall = Math.max(0, grantedPurchasedCredits - revokedPurchasedCredits);

  const updateResult = await updateCreditPlanBalances(admin, {
    userId: user.id,
    current: currentPlan,
    subscriptionCredits: 0,
    purchasedCredits: purchasedCredits - revokedPurchasedCredits,
    planType: "free",
    expiresAt: null,
    extra: {
      monthly_credit_amount: 0,
      monthly_credit_total_cycles: null,
      monthly_credit_granted_cycles: 0,
      next_credit_at: null,
    },
  });

  if (!updateResult.success) {
    console.error("[Latpeed Webhook] cancellation revoke failed:", updateResult.error);
    await admin
      .from("toss_payments")
      .update({
        status: "CANCELLATION_FAILED",
        metadata: {
          ...(originalPayment.metadata || {}),
          latpeedCancelEventKey: eventKey,
          latpeedCancelPayload: payload,
          manualReviewRequired: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", originalPayment.payment_key);
    await updateEventStatus(admin, eventKey, "failed", "revoke_failed", user.id);
    return { ok: true, status: "revoke_failed" };
  }

  const totalRevoked = revokedSubscriptionCredits + revokedPurchasedCredits;

  if (totalRevoked > 0) {
    await recordCreditTransaction({
      userId: user.id,
      type: "manual_deduct",
      amount: -totalRevoked,
      balanceAfter: updateResult.plan.credits,
      eventType: "refund",
      action: "latpeed_initial_program_cancel",
      subscriptionCreditsDelta: -revokedSubscriptionCredits,
      purchasedCreditsDelta: -revokedPurchasedCredits,
      subscriptionCreditsBalance: updateResult.plan.subscriptionCredits,
      purchasedCreditsBalance: updateResult.plan.purchasedCredits,
      description: `latpeed cancelled: initial program (${totalRevoked}cr)`,
      referenceId: originalPayment.order_id,
      metadata: {
        provider: PROVIDER,
        paymentKind: "initial_program",
        latpeedCancelEventKey: eventKey,
        canceledReason: readString(payment.canceledReason),
        revokedSubscriptionCredits,
        revokedPurchasedCredits,
        remainingShortfall,
      },
    });
  }

  await admin
    .from("toss_payments")
    .update({
      status: "CANCELLED",
      metadata: {
        ...(originalPayment.metadata || {}),
        latpeedPaymentStatus: "CANCEL",
        latpeedCancelEventKey: eventKey,
        latpeedCancelPayload: payload,
        canceledReason: readString(payment.canceledReason),
        cancelledAmount: amount,
        revokedSubscriptionCredits,
        revokedPurchasedCredits,
        revokedCredits: totalRevoked,
        remainingShortfall,
        cancelledAt: toIsoDate(payment.date),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", originalPayment.payment_key);

  await updateEventStatus(admin, eventKey, "processed", undefined, user.id);
  return { ok: true, status: "cancelled" };
}

export async function POST(request: NextRequest) {
  const secret = verifySecret(request);
  if (!secret.ok) {
    return NextResponse.json({ ok: false, error: secret.error }, { status: secret.status });
  }

  const payload = (await request.json().catch(() => null)) as LatpeedWebhookPayload | null;
  if (!payload || typeof payload !== "object" || !payload.payment) {
    await tryInsertRawEvent(createAdminClient(), {
      reason: "invalid_payload",
      payload,
    });
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const type = readString(payload.type) as LatpeedWebhookType;
  const payment = payload.payment;
  const paymentStatus = readString(payment.status) as LatpeedPaymentStatus;
  const admin = createAdminClient();

  if (type !== "NORMAL_PAYMENT") {
    await tryInsertRawEvent(admin, {
      reason: `unsupported_type:${type || "UNKNOWN"}`,
      payload,
      eventType: type || "UNKNOWN",
      paymentStatus: paymentStatus || "UNKNOWN",
      signupEmail: normalizeEmail(payment.email),
      amount: readAmount(payment.amount),
    });
    return NextResponse.json({ ok: true, skipped: "unsupported_type" });
  }

  if (paymentStatus !== "SUCCESS" && paymentStatus !== "CANCEL") {
    await tryInsertRawEvent(admin, {
      reason: `unsupported_status:${paymentStatus || "UNKNOWN"}`,
      payload,
      eventType: type,
      paymentStatus: paymentStatus || "UNKNOWN",
      signupEmail: normalizeEmail(payment.email),
      amount: readAmount(payment.amount),
    });
    return NextResponse.json({ ok: true, skipped: "unsupported_status" });
  }

  const amount = readAmount(payment.amount);
  const { email: signupEmail, source: signupEmailSource } = extractSignupEmail(payment);
  if (!signupEmail) {
    await tryInsertRawEvent(admin, {
      reason: "missing_signup_email",
      payload,
      eventType: type,
      paymentStatus,
      amount,
    });
    return NextResponse.json({ ok: true, status: "missing_signup_email" });
  }

  const { eventKey, orderId } = buildEventIdentity(type, paymentStatus, payment, signupEmail);
  const event = await tryInsertEvent(admin, {
    eventKey,
    type,
    paymentStatus,
    signupEmail,
    amount,
    payload,
  });

  if (!event.ok) {
    return NextResponse.json({ ok: false, error: "event_insert_failed" }, { status: 500 });
  }

  if (event.duplicate) {
    return NextResponse.json({ ok: true, status: "duplicate" });
  }

  const result =
    paymentStatus === "SUCCESS"
      ? await handleSuccess({
          admin,
          payload,
          payment,
          eventKey,
          orderId,
          signupEmail,
          signupEmailSource,
          amount,
          paidAt: toIsoDate(payment.date),
        })
      : await handleCancel({
          admin,
          payload,
          payment,
          eventKey,
          orderId,
          signupEmail,
          amount,
        });

  return NextResponse.json(result);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
