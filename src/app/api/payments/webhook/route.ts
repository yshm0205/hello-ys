import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "@portone/server-sdk";

import { finalizePortOnePayment } from "@/lib/payments/portone";

const PORTONE_WEBHOOK_SECRET = process.env.PORTONE_WEBHOOK_SECRET || "";

function getHeaderValue(request: NextRequest, name: string) {
  return request.headers.get(name) || "";
}

export async function POST(request: NextRequest) {
  if (!PORTONE_WEBHOOK_SECRET) {
    console.error("[PortOne Webhook] PORTONE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  try {
    const payload = await request.text();
    const webhook = await Webhook.verify(PORTONE_WEBHOOK_SECRET, payload, {
      "webhook-id": getHeaderValue(request, "webhook-id"),
      "webhook-timestamp": getHeaderValue(request, "webhook-timestamp"),
      "webhook-signature": getHeaderValue(request, "webhook-signature"),
    });

    if (
      !Webhook.isUnrecognizedWebhook(webhook) &&
      webhook.type.startsWith("Transaction.") &&
      "data" in webhook &&
      webhook.data &&
      typeof webhook.data === "object" &&
      "paymentId" in webhook.data &&
      typeof webhook.data.paymentId === "string"
    ) {
      const result = await finalizePortOnePayment(webhook.data.paymentId, {
        forceRefresh: true,
      });

      if (!result.success && !result.pending) {
        console.error("[PortOne Webhook] finalize failed:", {
          type: webhook.type,
          paymentId: webhook.data.paymentId,
          error: result.error,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PortOne Webhook] Error:", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
