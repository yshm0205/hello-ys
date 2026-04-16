const ALIMTALK_WEBHOOK_URL = process.env.ALIMTALK_WEBHOOK_URL || "";
const ALIMTALK_WEBHOOK_TOKEN = process.env.ALIMTALK_WEBHOOK_TOKEN || "";
const ALIMTALK_PAYMENT_COMPLETE_TEMPLATE_CODE =
  process.env.ALIMTALK_PAYMENT_COMPLETE_TEMPLATE_CODE || "payment_complete";

interface PaymentCompleteAlimtalkInput {
  buyerName?: string | null;
  buyerPhone?: string | null;
  amount: number;
  grantedCredits: number;
  dashboardUrl: string;
  lecturesUrl: string;
  scriptsUrl: string;
}

function normalizePhone(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

export async function sendPaymentCompleteAlimtalk(
  input: PaymentCompleteAlimtalkInput,
) {
  if (!ALIMTALK_WEBHOOK_URL) {
    return { success: false as const, skipped: true as const, reason: "missing_webhook_url" };
  }

  const phone = normalizePhone(input.buyerPhone);
  if (!/^01\d{8,9}$/.test(phone)) {
    return { success: false as const, skipped: true as const, reason: "invalid_phone" };
  }

  const payload = {
    channel: "alimtalk",
    event: "payment_complete",
    templateCode: ALIMTALK_PAYMENT_COMPLETE_TEMPLATE_CODE,
    to: phone,
    message: [
      "[FlowSpot] 결제가 완료되었습니다.",
      `올인원 패스가 활성화되었고, ${input.grantedCredits.toLocaleString()}cr가 지급되었습니다.`,
    ].join("\n"),
    variables: {
      buyerName: input.buyerName || "",
      amount: input.amount,
      grantedCredits: input.grantedCredits,
      dashboardUrl: input.dashboardUrl,
      lecturesUrl: input.lecturesUrl,
      scriptsUrl: input.scriptsUrl,
    },
    buttons: [
      {
        type: "WL",
        name: "강의실 바로가기",
        linkMobile: input.lecturesUrl,
        linkPc: input.lecturesUrl,
      },
      {
        type: "WL",
        name: "스크립트 제작 시작",
        linkMobile: input.scriptsUrl,
        linkPc: input.scriptsUrl,
      },
      {
        type: "WL",
        name: "대시보드",
        linkMobile: input.dashboardUrl,
        linkPc: input.dashboardUrl,
      },
    ],
  };

  const res = await fetch(ALIMTALK_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ALIMTALK_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${ALIMTALK_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const responseText = await res.text().catch(() => "");
    throw new Error(`alimtalk_webhook_failed:${res.status}:${responseText}`);
  }

  return { success: true as const };
}
