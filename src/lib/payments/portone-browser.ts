"use client";

import * as PortOne from "@portone/browser-sdk/v2";
import type { PaymentRequest } from "@portone/browser-sdk/v2";

const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "";
const PORTONE_CHANNEL_KEY_TOSSPAY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSSPAY || "";

export type PortOnePaymentMethod = "CARD" | "TOSSPAY";

export type CardCompanyCode =
  | "SHINHAN_CARD"
  | "SAMSUNG_CARD"
  | "HYUNDAI_CARD"
  | "NH_CARD";

type PortOneCheckoutInput = {
  paymentId: string;
  orderName: string;
  amount: number;
  customerId?: string;
  customerEmail?: string;
  paymentMethod?: PortOnePaymentMethod;
  cardCompany?: CardCompanyCode;
};

type PortOneCheckoutResult =
  | { ok: true }
  | { ok: false; error: string; cancelled?: boolean };

function isCancelledError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";
  const pgMessage = typeof record.pgMessage === "string" ? record.pgMessage : "";
  const combined = `${code} ${message} ${pgMessage}`.toLowerCase();

  return (
    combined.includes("pay_process_canceled") ||
    combined.includes("usercancel") ||
    (combined.includes("사용자") && combined.includes("취소"))
  );
}

function formatPortOneError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.pgMessage, record.code, record.pgCode]
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    if (parts.length > 0) {
      return parts.join(" / ");
    }
  }

  return "결제 요청에 실패했습니다.";
}

export async function requestPortOneCheckout(
  input: PortOneCheckoutInput,
): Promise<PortOneCheckoutResult> {
  if (!PORTONE_STORE_ID || !PORTONE_CHANNEL_KEY_TOSSPAY) {
    return {
      ok: false,
      error: "PortOne 결제 환경변수가 설정되지 않았습니다.",
    };
  }

  const origin = window.location.origin;
  const currentLocale = window.location.pathname.split("/")[1] === "en" ? "en" : "ko";
  const paymentMethod = input.paymentMethod || "CARD";

  const paymentRequest = {
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY_TOSSPAY,
    paymentId: input.paymentId,
    orderName: input.orderName,
    totalAmount: input.amount,
    currency: "KRW",
    payMethod: paymentMethod === "TOSSPAY" ? "EASY_PAY" : "CARD",
    ...(paymentMethod === "TOSSPAY"
      ? {
          easyPayProvider: "TOSSPAY",
        }
      : input.cardCompany
        ? {
            // 심사 완료된 카드사만 다이렉트 호출 (5/9경 심사 완료 예정)
            // 완료 후 cardCompany 파라미터 제거로 일반 카드 결제창 복구
            card: {
              cardCompany: input.cardCompany,
            },
          }
        : {}),
    redirectUrl: `${origin}/${currentLocale}/dashboard/credits/success`,
    noticeUrls: [`${origin}/api/payments/webhook`],
    customer: {
      customerId: input.customerId,
      email: input.customerEmail,
    },
    customData: {
      paymentId: input.paymentId,
      source: "flowspot-web",
      paymentMethod,
    },
  } as unknown as PaymentRequest;

  try {
    const result = await PortOne.requestPayment(paymentRequest);

    if (result?.code) {
      if (isCancelledError(result)) {
        return {
          ok: false,
          cancelled: true,
          error: "결제를 취소했습니다.",
        };
      }

      const errorParts = [result.message, result.pgMessage].filter(Boolean).join(" / ");
      return {
        ok: false,
        error:
          errorParts ||
          (result.pgCode
            ? `결제 요청에 실패했습니다. (${result.pgCode})`
            : "결제 요청에 실패했습니다."),
      };
    }

    if (result?.paymentId) {
      const successUrl = new URL(`${origin}/${currentLocale}/dashboard/credits/success`);
      successUrl.searchParams.set("paymentId", result.paymentId);
      window.location.assign(successUrl.toString());
      return { ok: true };
    }

    return { ok: true };
  } catch (error) {
    console.error("PortOne browser payment failed:", error);

    if (isCancelledError(error)) {
      return {
        ok: false,
        cancelled: true,
        error: "결제를 취소했습니다.",
      };
    }

    return {
      ok: false,
      error: formatPortOneError(error),
    };
  }
}

export const requestPortOneTossPayment = requestPortOneCheckout;
