const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || "";

type TelegramNotifyResult =
  | { success: true }
  | { skipped: true; reason: "not_configured" | "request_failed" };

type TelegramPaymentCompletedPayload = {
  userId: string;
  email?: string;
  name?: string;
  amount: number;
  grantedCredits: number;
  orderId?: string;
  orderName?: string | null;
  paymentKind?: string | null;
  provider?: string | null;
  paymentId?: string | null;
  planType?: string | null;
  paidAt?: string;
};

type TelegramFeedbackReceivedPayload = {
  userId: string;
  email?: string;
  message: string;
  ipAddress?: string;
  sentAt?: string;
};

type TelegramStudentReviewSubmittedPayload = {
  reviewId: string;
  userId: string;
  email?: string;
  rating: number;
  headline?: string | null;
  content: string;
  channelName?: string | null;
  proofUrl?: string | null;
  marketingConsent?: boolean;
  feedbackTicketsGranted?: number;
  submittedAt?: string;
};

type TelegramFeedbackRequestSubmittedPayload = {
  requestId: string;
  userId: string;
  email?: string | null;
  requestType: string;
  requestTypeLabel?: string;
  title: string;
  description: string;
  referenceUrl?: string | null;
  feedbackTicketsRemaining?: number;
  submittedAt?: string;
};

function isConfigured() {
  return !!TELEGRAM_BOT_TOKEN && !!TELEGRAM_CHAT_ID;
}

function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function formatDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
  });
}

function pick(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim() : "-";
}

function clipText(value: string, maxLength = 700) {
  const normalized = value.trim().replace(/\r\n/g, "\n");
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

async function sendTelegramMessage(text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${response.status} ${errorText}`);
  }
}

async function notifyTelegram(lines: string[], logLabel: string): Promise<TelegramNotifyResult> {
  if (!isConfigured()) {
    return { skipped: true, reason: "not_configured" };
  }

  try {
    await sendTelegramMessage(lines.join("\n"));
    return { success: true };
  } catch (error) {
    console.error(`[Telegram] ${logLabel} notify failed:`, error);
    return { skipped: true, reason: "request_failed" };
  }
}

export async function notifyTelegramPaymentCompleted(
  payload: TelegramPaymentCompletedPayload,
): Promise<TelegramNotifyResult> {
  return notifyTelegram(
    [
      "결제 성공",
      `상품: ${pick(payload.orderName)}`,
      `금액: ${formatWon(payload.amount)}`,
      `이메일: ${pick(payload.email)}`,
      `이름: ${pick(payload.name)}`,
      `지급 크레딧: ${payload.grantedCredits.toLocaleString("ko-KR")}cr`,
      `주문번호: ${pick(payload.orderId)}`,
      `결제키: ${pick(payload.paymentId)}`,
      `결제종류: ${pick(payload.paymentKind)}`,
      `제공자: ${pick(payload.provider)}`,
      `플랜: ${pick(payload.planType)}`,
      `사용자ID: ${pick(payload.userId)}`,
      `시각: ${formatDateTime(payload.paidAt)}`,
    ],
    "payment_completed",
  );
}

export async function notifyTelegramFeedbackReceived(
  payload: TelegramFeedbackReceivedPayload,
): Promise<TelegramNotifyResult> {
  return notifyTelegram(
    [
      "문의 접수",
      `이메일: ${pick(payload.email)}`,
      `사용자ID: ${pick(payload.userId)}`,
      `IP: ${pick(payload.ipAddress)}`,
      `시각: ${formatDateTime(payload.sentAt)}`,
      "",
      clipText(payload.message),
    ],
    "feedback_received",
  );
}

export async function notifyTelegramStudentReviewSubmitted(
  payload: TelegramStudentReviewSubmittedPayload,
): Promise<TelegramNotifyResult> {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://flowspot.kr"}/ko/admin/reviews`;

  return notifyTelegram(
    [
      "새 수강 후기",
      "",
      `평점: ${"★".repeat(Math.max(1, Math.min(5, payload.rating)))} (${payload.rating}/5)`,
      `이메일: ${pick(payload.email)}`,
      `채널명: ${pick(payload.channelName)}`,
      `마케팅 동의: ${payload.marketingConsent ? "동의" : "미동의"}`,
      `피드백권 지급: ${(payload.feedbackTicketsGranted ?? 0).toLocaleString("ko-KR")}회`,
      `후기ID: ${pick(payload.reviewId)}`,
      `사용자ID: ${pick(payload.userId)}`,
      `시각: ${formatDateTime(payload.submittedAt)}`,
      "",
      `제목: ${pick(payload.headline)}`,
      "",
      clipText(payload.content, 900),
      ...(payload.proofUrl ? ["", `인증 링크: ${payload.proofUrl}`] : []),
      "",
      `관리: ${adminUrl}`,
    ],
    "student_review_submitted",
  );
}

export async function notifyTelegramFeedbackRequestSubmitted(
  payload: TelegramFeedbackRequestSubmittedPayload,
): Promise<TelegramNotifyResult> {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://flowspot.kr"}/ko/admin/feedback-requests`;

  return notifyTelegram(
    [
      "새 피드백 요청",
      "",
      `유형: ${pick(payload.requestTypeLabel || payload.requestType)}`,
      `제목: ${payload.title}`,
      `이메일: ${pick(payload.email)}`,
      `남은 피드백권: ${
        typeof payload.feedbackTicketsRemaining === "number"
          ? `${payload.feedbackTicketsRemaining.toLocaleString("ko-KR")}회`
          : "-"
      }`,
      `요청ID: ${pick(payload.requestId)}`,
      `사용자ID: ${pick(payload.userId)}`,
      `시각: ${formatDateTime(payload.submittedAt)}`,
      "",
      clipText(payload.description, 900),
      ...(payload.referenceUrl ? ["", `참고 링크: ${payload.referenceUrl}`] : []),
      "",
      `관리: ${adminUrl}`,
    ],
    "feedback_request_submitted",
  );
}
