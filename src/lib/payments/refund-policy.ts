import { TOSSPAY_PLAN_CONFIG } from "@/lib/plans/config";
import {
  getStoredGrantedPurchasedCredits,
  getStoredGrantedSubscriptionCredits,
} from "@/lib/payments/grant-snapshot";
import { createAdminClient } from "@/utils/supabase/admin";

const SEOUL_TIME_ZONE = "Asia/Seoul";
const INITIAL_PROGRAM_FULL_REFUND_DAYS = 7;
const INITIAL_PROGRAM_PARTIAL_REFUND_DAYS = 28;
const INITIAL_PROGRAM_LECTURE_LIMIT = 5;
const INITIAL_PROGRAM_PARTIAL_RATE_1 = 2 / 3;
const INITIAL_PROGRAM_PARTIAL_RATE_2 = 1 / 2;
const REFUND_PENALTY_RATE = 0.1;
const CREDIT_TOPUP_REFUND_DAYS = 7;

const FULL_PLAN_SELECT =
  "credits, subscription_credits, purchased_credits, plan_type, expires_at";
const LEGACY_PLAN_SELECT = "credits, plan_type, expires_at";

type PaymentKind = "initial_program" | "credit_topup";

type StoredPaymentRow = {
  created_at: string;
  user_id: string;
  order_id: string;
  order_name: string | null;
  amount: number;
  credits: number | null;
  status: string;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
};

type PaymentListRow = Pick<
  StoredPaymentRow,
  "created_at" | "payment_key" | "credits" | "metadata" | "status"
>;

type LectureProgressRow = {
  vod_id: string;
  last_position: number | null;
  completed_at: string | null;
};

type CreditPlanRow = {
  credits?: number | null;
  subscription_credits?: number | null;
  purchased_credits?: number | null;
  plan_type?: string | null;
  expires_at?: string | null;
};

type CreditPlanSnapshot = {
  credits: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  planType: string;
  expiresAt: string | null;
};

type RefundPreviewBase = {
  paymentKey: string;
  orderId: string;
  orderName: string;
  paymentKind: PaymentKind;
  paymentAmount: number;
  refundAmount: number;
  refundable: boolean;
  refundType: "full" | "partial" | "blocked";
  requiresPartialCancel: boolean;
  revokeScope: "plan_and_credits" | "purchased_credits";
  reason: string;
  warnings: string[];
  elapsedDays: number;
  materialDownloadTracked: boolean;
};

export type AdminRefundPreview = RefundPreviewBase & {
  lectureCount: number;
  lectureThreshold: number | null;
  creditsUsed: boolean;
  grantedSubscriptionCredits: number;
  remainingSubscriptionCredits: number;
  grantedPurchasedCredits: number;
  remainingPurchasedCreditsFromPayment: number;
  penaltyAmount: number;
};

export type AdminRefundEvaluation =
  | { ok: true; payment: StoredPaymentRow; preview: AdminRefundPreview }
  | { ok: false; status: number; error: string };

function getPaymentKind(payment: StoredPaymentRow): PaymentKind | null {
  return payment.metadata?.paymentKind === "initial_program"
    ? "initial_program"
    : payment.metadata?.paymentKind === "credit_topup"
      ? "credit_topup"
      : null;
}

function getPurchasedGrantedCredits(payment: Pick<StoredPaymentRow, "credits" | "metadata">) {
  const fallback =
    payment.metadata?.paymentKind === "credit_topup" ? Number(payment.credits ?? 0) : 0;

  return getStoredGrantedPurchasedCredits(payment.metadata, fallback);
}

function getInitialSubscriptionCredits(payment: StoredPaymentRow) {
  if (payment.metadata?.paymentKind !== "initial_program") {
    return 0;
  }

  const config =
    typeof payment.metadata?.planType === "string" &&
    payment.metadata.planType in TOSSPAY_PLAN_CONFIG
      ? TOSSPAY_PLAN_CONFIG[payment.metadata.planType as keyof typeof TOSSPAY_PLAN_CONFIG]
      : TOSSPAY_PLAN_CONFIG.allinone;

  return getStoredGrantedSubscriptionCredits(payment.metadata, config.initialCredits);
}

function getKstDaySerial(input: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(input));

  const year = Number(parts.find((part) => part.type === "year")?.value || "0");
  const month = Number(parts.find((part) => part.type === "month")?.value || "1");
  const day = Number(parts.find((part) => part.type === "day")?.value || "1");

  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function getElapsedDaysInclusive(createdAt: string, now: Date) {
  return Math.max(1, getKstDaySerial(now) - getKstDaySerial(createdAt) + 1);
}

function calculatePenaltyAmount(paymentAmount: number) {
  return Math.max(0, Math.floor(paymentAmount * REFUND_PENALTY_RATE));
}

function calculateInitialProgramRefundAmount(paymentAmount: number, elapsedDays: number) {
  if (elapsedDays <= INITIAL_PROGRAM_FULL_REFUND_DAYS) {
    return paymentAmount;
  }

  const penaltyAmount = calculatePenaltyAmount(paymentAmount);

  if (elapsedDays <= 14) {
    return Math.max(0, Math.floor(paymentAmount * INITIAL_PROGRAM_PARTIAL_RATE_1 - penaltyAmount));
  }

  if (elapsedDays <= INITIAL_PROGRAM_PARTIAL_REFUND_DAYS) {
    return Math.max(0, Math.floor(paymentAmount * INITIAL_PROGRAM_PARTIAL_RATE_2 - penaltyAmount));
  }

  return 0;
}

async function loadCurrentPlanSnapshot(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<CreditPlanSnapshot> {
  const fullResult = await admin
    .from("user_plans")
    .select(FULL_PLAN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (!fullResult.error) {
    const row = fullResult.data as CreditPlanRow | null;
    if (!row) {
      return {
        credits: 0,
        subscriptionCredits: 0,
        purchasedCredits: 0,
        planType: "free",
        expiresAt: null,
      };
    }

    return {
      credits: (row.subscription_credits ?? 0) + (row.purchased_credits ?? 0),
      subscriptionCredits: Math.max(0, row.subscription_credits ?? 0),
      purchasedCredits: Math.max(0, row.purchased_credits ?? 0),
      planType: row.plan_type ?? "free",
      expiresAt: row.expires_at ?? null,
    };
  }

  const errorCode = (fullResult.error as { code?: string } | null)?.code;
  if (errorCode !== "42703") {
    console.error("[RefundPolicy] Failed to load current plan:", fullResult.error);
    return {
      credits: 0,
      subscriptionCredits: 0,
      purchasedCredits: 0,
      planType: "free",
      expiresAt: null,
    };
  }

  const legacyResult = await admin
    .from("user_plans")
    .select(LEGACY_PLAN_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (legacyResult.error) {
    console.error("[RefundPolicy] Failed to load legacy current plan:", legacyResult.error);
    return {
      credits: 0,
      subscriptionCredits: 0,
      purchasedCredits: 0,
      planType: "free",
      expiresAt: null,
    };
  }

  const row = legacyResult.data as CreditPlanRow | null;
  return {
    credits: Math.max(0, row?.credits ?? 0),
    subscriptionCredits: 0,
    purchasedCredits: Math.max(0, row?.credits ?? 0),
    planType: row?.plan_type ?? "free",
    expiresAt: row?.expires_at ?? null,
  };
}

async function countStartedLectures(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("lecture_progress")
    .select("vod_id, last_position, completed_at")
    .eq("user_id", userId);

  if (error) {
    console.error("[RefundPolicy] Failed to load lecture progress:", error);
    return 0;
  }

  const started = new Set<string>();

  for (const row of (data || []) as LectureProgressRow[]) {
    if (row.completed_at || (row.last_position ?? 0) > 0) {
      started.add(row.vod_id);
    }
  }

  return started.size;
}

async function getRemainingPurchasedCreditsForPayment(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  paymentKey: string,
  currentPurchasedCredits: number,
) {
  const { data, error } = await admin
    .from("toss_payments")
    .select("created_at, payment_key, credits, metadata, status")
    .eq("user_id", userId)
    .eq("status", "DONE")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[RefundPolicy] Failed to load user payment history:", error);
    return 0;
  }

  const payments = (data || []) as PaymentListRow[];
  const grants = payments
    .map((row) => ({
      paymentKey: row.payment_key || "",
      granted: getPurchasedGrantedCredits(row),
    }))
    .filter((row) => row.granted > 0);

  let remainingPool = Math.min(
    Math.max(0, currentPurchasedCredits),
    grants.reduce((sum, row) => sum + row.granted, 0),
  );

  for (const row of grants) {
    const remainingForRow = Math.min(row.granted, remainingPool);

    if (row.paymentKey === paymentKey) {
      return remainingForRow;
    }

    remainingPool = Math.max(0, remainingPool - remainingForRow);
  }

  return 0;
}

function buildOrderName(payment: StoredPaymentRow) {
  return payment.order_name || `FlowSpot ${payment.order_id}`;
}

async function buildInitialProgramPreview(
  admin: ReturnType<typeof createAdminClient>,
  payment: StoredPaymentRow,
  now: Date,
): Promise<AdminRefundPreview> {
  const elapsedDays = getElapsedDaysInclusive(payment.created_at, now);
  const currentPlan = await loadCurrentPlanSnapshot(admin, payment.user_id);
  const lectureCount = await countStartedLectures(admin, payment.user_id);
  const grantedSubscriptionCredits = getInitialSubscriptionCredits(payment);
  const grantedPurchasedCredits = getPurchasedGrantedCredits(payment);
  const remainingPurchasedCreditsFromPayment = await getRemainingPurchasedCreditsForPayment(
    admin,
    payment.user_id,
    payment.payment_key || "",
    currentPlan.purchasedCredits,
  );

  const subscriptionCreditsUsed = currentPlan.subscriptionCredits < grantedSubscriptionCredits;
  const purchasedCreditsUsed =
    remainingPurchasedCreditsFromPayment < grantedPurchasedCredits;
  const creditsUsed = subscriptionCreditsUsed || purchasedCreditsUsed;
  const warnings = [
    "자료 다운로드 이력은 아직 자동 추적되지 않아 운영자가 별도 확인해야 합니다.",
    "부분 환불이더라도 올인원 이용권과 잔여 크레딧은 전부 회수됩니다.",
  ];

  let reason = "";
  let refundAmount = 0;
  let refundType: AdminRefundPreview["refundType"] = "blocked";

  if (elapsedDays > INITIAL_PROGRAM_PARTIAL_REFUND_DAYS) {
    reason = "결제 후 29일이 지나 환불 대상이 아닙니다.";
  } else if (lectureCount >= INITIAL_PROGRAM_LECTURE_LIMIT) {
    reason = `강의를 ${lectureCount}강 수강해 5강 기준을 넘어 환불이 불가합니다.`;
  } else if (creditsUsed) {
    reason = "패스 지급 크레딧을 1개 이상 사용한 것으로 판단되어 환불이 불가합니다.";
  } else {
    refundAmount = calculateInitialProgramRefundAmount(payment.amount, elapsedDays);

    if (refundAmount <= 0) {
      reason = "규정상 공제 금액이 커서 환불 금액이 0원입니다.";
    } else if (elapsedDays <= INITIAL_PROGRAM_FULL_REFUND_DAYS) {
      refundType = "full";
      reason = "결제 후 7일 이내이며 차단 조건에 해당하지 않아 전액 환불 대상입니다.";
    } else {
      refundType = "partial";
      reason =
        elapsedDays <= 14
          ? "결제 후 8~14일 구간이라 실결제금액의 2/3에서 위약금 10%를 공제한 금액으로 환불됩니다."
          : "결제 후 15~28일 구간이라 실결제금액의 1/2에서 위약금 10%를 공제한 금액으로 환불됩니다.";
    }
  }

  return {
    paymentKey: payment.payment_key || "",
    orderId: payment.order_id,
    orderName: buildOrderName(payment),
    paymentKind: "initial_program",
    paymentAmount: payment.amount,
    refundAmount,
    refundable: refundAmount > 0,
    refundType,
    requiresPartialCancel: refundType === "partial",
    revokeScope: "plan_and_credits",
    reason,
    warnings,
    elapsedDays,
    lectureCount,
    lectureThreshold: INITIAL_PROGRAM_LECTURE_LIMIT,
    creditsUsed,
    grantedSubscriptionCredits,
    remainingSubscriptionCredits: Math.max(0, currentPlan.subscriptionCredits),
    grantedPurchasedCredits,
    remainingPurchasedCreditsFromPayment,
    penaltyAmount: calculatePenaltyAmount(payment.amount),
    materialDownloadTracked: false,
  };
}

async function buildCreditTopupPreview(
  admin: ReturnType<typeof createAdminClient>,
  payment: StoredPaymentRow,
  now: Date,
): Promise<AdminRefundPreview> {
  const elapsedDays = getElapsedDaysInclusive(payment.created_at, now);
  const currentPlan = await loadCurrentPlanSnapshot(admin, payment.user_id);
  const grantedPurchasedCredits = getPurchasedGrantedCredits(payment);
  const remainingPurchasedCreditsFromPayment = await getRemainingPurchasedCreditsForPayment(
    admin,
    payment.user_id,
    payment.payment_key || "",
    currentPlan.purchasedCredits,
  );
  const creditsUsed = remainingPurchasedCreditsFromPayment < grantedPurchasedCredits;

  let reason = "";
  let refundAmount = 0;
  let refundType: AdminRefundPreview["refundType"] = "blocked";

  if (elapsedDays > CREDIT_TOPUP_REFUND_DAYS) {
    reason = "토큰 팩은 결제 후 7일이 지나 환불할 수 없습니다.";
  } else if (creditsUsed) {
    reason = "이 토큰 팩에서 지급된 크레딧을 이미 사용한 것으로 판단되어 환불할 수 없습니다.";
  } else {
    refundAmount = payment.amount;
    refundType = "full";
    reason = "결제 후 7일 이내이며 미사용 상태라 토큰 팩 전액 환불 대상입니다.";
  }

  return {
    paymentKey: payment.payment_key || "",
    orderId: payment.order_id,
    orderName: buildOrderName(payment),
    paymentKind: "credit_topup",
    paymentAmount: payment.amount,
    refundAmount,
    refundable: refundAmount > 0,
    refundType,
    requiresPartialCancel: false,
    revokeScope: "purchased_credits",
    reason,
    warnings: [],
    elapsedDays,
    lectureCount: 0,
    lectureThreshold: null,
    creditsUsed,
    grantedSubscriptionCredits: 0,
    remainingSubscriptionCredits: 0,
    grantedPurchasedCredits,
    remainingPurchasedCreditsFromPayment,
    penaltyAmount: 0,
    materialDownloadTracked: true,
  };
}

export async function evaluateAdminRefund(
  paymentKey: string,
  now = new Date(),
): Promise<AdminRefundEvaluation> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("toss_payments")
    .select("created_at, user_id, order_id, order_name, amount, credits, status, payment_key, metadata")
    .eq("payment_key", paymentKey)
    .maybeSingle();

  if (error) {
    console.error("[RefundPolicy] Failed to load payment:", error);
    return { ok: false, status: 500, error: "결제 조회에 실패했습니다." };
  }

  const payment = data as StoredPaymentRow | null;
  if (!payment) {
    return { ok: false, status: 404, error: "결제를 찾을 수 없습니다." };
  }

  if (payment.status !== "DONE") {
    return {
      ok: false,
      status: 409,
      error: `현재 상태(${payment.status})에서는 환불 계산을 진행할 수 없습니다.`,
    };
  }

  const paymentKind = getPaymentKind(payment);
  if (!paymentKind) {
    return { ok: false, status: 400, error: "지원하지 않는 결제 유형입니다." };
  }

  const preview =
    paymentKind === "initial_program"
      ? await buildInitialProgramPreview(admin, payment, now)
      : await buildCreditTopupPreview(admin, payment, now);

  return {
    ok: true,
    payment,
    preview,
  };
}
