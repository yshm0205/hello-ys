import { NextRequest, NextResponse } from "next/server";
import { PaymentClient } from "@portone/server-sdk";

import { evaluateAdminRefund } from "@/lib/payments/refund-policy";
import { finalizePortOnePayment } from "@/lib/payments/portone";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET || "";
const APPLIED_CANCEL_STATUSES = new Set(["CANCELLED", "PARTIAL_CANCELLED"]);

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",")
      .map((email) => email.trim())
      .filter(Boolean) || [];

  if (!adminEmails.includes(user.email)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, user };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> },
) {
  const adminCheck = await requireAdminUser();
  if (!adminCheck.ok) {
    return adminCheck.response;
  }

  const { paymentKey } = await params;
  if (!paymentKey) {
    return NextResponse.json({ error: "paymentKey is required" }, { status: 400 });
  }

  const evaluation = await evaluateAdminRefund(paymentKey);
  if (!evaluation.ok) {
    return NextResponse.json({ error: evaluation.error }, { status: evaluation.status });
  }

  return NextResponse.json({
    success: true,
    preview: evaluation.preview,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentKey: string }> },
) {
  const adminCheck = await requireAdminUser();
  if (!adminCheck.ok) {
    return adminCheck.response;
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
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  const evaluation = await evaluateAdminRefund(paymentKey);
  if (!evaluation.ok) {
    return NextResponse.json({ error: evaluation.error }, { status: evaluation.status });
  }

  const { payment, preview } = evaluation;

  if (!preview.refundable || preview.refundAmount <= 0) {
    return NextResponse.json(
      {
        error: preview.reason,
        preview,
      },
      { status: 409 },
    );
  }

  const portoneClient = PaymentClient({ secret: PORTONE_API_SECRET });

  try {
    await portoneClient.cancelPayment({
      paymentId: paymentKey,
      reason,
      ...(preview.requiresPartialCancel
        ? {
            amount: preview.refundAmount,
            currentCancellableAmount: payment.amount,
          }
        : {}),
    });
  } catch (portoneError) {
    console.error("[Admin Cancel] portone cancelPayment failed:", portoneError);
    const message =
      portoneError instanceof Error
        ? portoneError.message
        : "포트원 취소 요청이 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const finalized = await finalizePortOnePayment(paymentKey, { forceRefresh: true });
  const finalizedStatus = "status" in finalized ? finalized.status : undefined;
  const finalizedError = "error" in finalized ? finalized.error : undefined;
  const cancellationApplied =
    (typeof finalizedStatus === "string" && APPLIED_CANCEL_STATUSES.has(finalizedStatus)) ||
    Boolean(finalized.success);

  const adminClient = createAdminClient();
  const { error: auditError } = await adminClient
    .from("toss_payments")
    .update({
      metadata: {
        ...(payment.metadata || {}),
        adminCancel: {
          at: new Date().toISOString(),
          by: adminCheck.user.email,
          reason,
          requestedRefundAmount: preview.refundAmount,
          paymentAmount: preview.paymentAmount,
          refundType: preview.refundType,
          revokeScope: preview.revokeScope,
          elapsedDays: preview.elapsedDays,
          lectureCount: preview.lectureCount,
          creditsUsed: preview.creditsUsed,
          materialDownloadTracked: preview.materialDownloadTracked,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("payment_key", paymentKey);

  if (auditError) {
    console.error("[Admin Cancel] failed to write adminCancel metadata:", auditError);
  }

  if (!cancellationApplied) {
    return NextResponse.json(
      {
        success: true,
        pendingSync: true,
        message: finalizedError || "취소 요청은 접수됐지만 상태 반영이 지연 중입니다.",
        preview,
      },
      { status: 202 },
    );
  }

  return NextResponse.json({
    success: true,
    paymentKey,
    preview,
    portoneStatus:
      finalizedStatus ?? (preview.requiresPartialCancel ? "PARTIAL_CANCELLED" : "CANCELLED"),
    message: preview.requiresPartialCancel
      ? "규정에 따른 부분 환불이 처리되었고, 이용권과 잔여 크레딧은 회수되었습니다."
      : "환불이 처리되었고, 관련 권한과 크레딧 회수가 반영되었습니다.",
  });
}
