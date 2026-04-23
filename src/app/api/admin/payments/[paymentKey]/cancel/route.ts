import { NextRequest, NextResponse } from "next/server";
import { PaymentClient } from "@portone/server-sdk";

import { finalizePortOnePayment } from "@/lib/payments/portone";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";

const NON_CANCELLABLE_STATUSES = new Set([
  "CANCELLED",
  "PARTIAL_CANCELLED",
  "CANCELLATION_PROCESSING",
  "CANCELLATION_FAILED",
  "FAILED",
  "PENDING",
  "READY",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!PORTONE_API_SECRET) {
      return NextResponse.json(
        { error: "PORTONE_API_SECRET is not configured" },
        { status: 500 },
      );
    }

    const { paymentKey } = await params;
    if (!paymentKey) {
      return NextResponse.json({ error: "paymentKey is required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason: string = typeof body?.reason === "string" ? body.reason.trim() : "";
    const amount: number | undefined =
      typeof body?.amount === "number" && Number.isFinite(body.amount) && body.amount > 0
        ? body.amount
        : undefined;
    const taxFreeAmount: number | undefined =
      typeof body?.taxFreeAmount === "number" && Number.isFinite(body.taxFreeAmount)
        ? body.taxFreeAmount
        : undefined;

    if (!reason) {
      return NextResponse.json({ error: "reason is required" }, { status: 400 });
    }

    // 1) DB에서 결제 조회 + 취소 가능 여부 체크
    const adminClient = createAdminClient();
    const { data: payment, error: paymentError } = await adminClient
      .from("toss_payments")
      .select("id, user_id, order_id, amount, status, payment_key, metadata")
      .eq("payment_key", paymentKey)
      .maybeSingle();

    if (paymentError) {
      console.error("[Admin Cancel] load payment failed:", paymentError);
      return NextResponse.json({ error: "결제 조회 실패" }, { status: 500 });
    }

    if (!payment) {
      return NextResponse.json({ error: "결제를 찾을 수 없습니다." }, { status: 404 });
    }

    if (NON_CANCELLABLE_STATUSES.has(payment.status)) {
      return NextResponse.json(
        { error: `현재 상태(${payment.status})에서는 취소할 수 없습니다.` },
        { status: 409 },
      );
    }

    if (amount !== undefined && amount > payment.amount) {
      return NextResponse.json(
        { error: "부분 취소 금액이 결제 금액보다 큽니다." },
        { status: 400 },
      );
    }

    // 2) 포트원 취소 호출
    const portoneClient = PaymentClient({ secret: PORTONE_API_SECRET });

    try {
      await portoneClient.cancelPayment({
        paymentId: paymentKey,
        reason,
        ...(amount !== undefined
          ? {
              amount,
              ...(taxFreeAmount !== undefined ? { taxFreeAmount } : {}),
              currentCancellableAmount: payment.amount,
            }
          : {}),
      });
    } catch (portoneError) {
      console.error("[Admin Cancel] portone cancelPayment failed:", portoneError);
      const message =
        portoneError instanceof Error ? portoneError.message : "포트원 취소 요청이 실패했습니다.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // 3) finalizePortOnePayment로 상태 재조회 → 기존 로직이 크레딧 회수
    const finalized = await finalizePortOnePayment(paymentKey, { forceRefresh: true });

    // 4) 감사 로그 (metadata에 누가/언제/왜)
    await adminClient
      .from("toss_payments")
      .update({
        metadata: {
          ...(payment.metadata || {}),
          adminCancel: {
            at: new Date().toISOString(),
            by: user.email,
            reason,
            amount: amount ?? payment.amount,
            partial: amount !== undefined && amount < payment.amount,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq("payment_key", paymentKey);

    return NextResponse.json({
      success: true,
      paymentKey,
      portoneStatus: finalized.success ? "DONE" : (finalized.status ?? "CANCELLED"),
      message: finalized.success
        ? "취소 요청이 접수되었지만 상태 반영이 지연 중입니다."
        : "결제가 취소되고 크레딧이 회수되었습니다.",
    });
  } catch (error) {
    console.error("[Admin Cancel] unexpected error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
