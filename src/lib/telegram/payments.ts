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
