"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RefundPreview = {
  paymentKey: string;
  orderId: string;
  orderName: string;
  paymentKind: "initial_program" | "credit_topup";
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
  lectureCount: number;
  lectureThreshold: number | null;
  creditsUsed: boolean;
  grantedSubscriptionCredits: number;
  remainingSubscriptionCredits: number;
  grantedPurchasedCredits: number;
  remainingPurchasedCreditsFromPayment: number;
  penaltyAmount: number;
};

export type RefundProvider = "portone" | "tosspay-direct";

interface RefundPaymentButtonProps {
  paymentKey: string;
  orderName: string;
  amount: number;
  disabled?: boolean;
  provider?: RefundProvider;
}

function formatWon(value: number) {
  return `₩ ${value.toLocaleString("ko-KR")}`;
}

export function RefundPaymentButton({
  paymentKey,
  orderName,
  amount,
  disabled,
  provider = "portone",
}: RefundPaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<RefundPreview | null>(null);

  const endpoint =
    provider === "tosspay-direct"
      ? `/api/admin/tosspay/${encodeURIComponent(paymentKey)}/cancel`
      : `/api/admin/payments/${encodeURIComponent(paymentKey)}/cancel`;

  useEffect(() => {
    if (!open) return;

    let aborted = false;

    async function fetchPreview() {
      setLoadingPreview(true);
      setMessage("");

      try {
        const res = await fetch(endpoint);
        const data = await res.json();

        if (aborted) return;

        if (!res.ok) {
          setPreview(null);
          setMessage(data.error || "환불 계산에 실패했습니다.");
          return;
        }

        setPreview(data.preview || null);
      } catch {
        if (!aborted) {
          setPreview(null);
          setMessage("환불 계산을 불러오는 중 네트워크 오류가 발생했습니다.");
        }
      } finally {
        if (!aborted) {
          setLoadingPreview(false);
        }
      }
    }

    void fetchPreview();

    return () => {
      aborted = true;
    };
  }, [open, endpoint]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!preview?.refundable) {
      setMessage(preview?.reason || "현재 환불할 수 없는 결제입니다.");
      return;
    }

    const confirmLabel =
      preview.refundType === "partial"
        ? `${formatWon(preview.refundAmount)} 부분 환불`
        : `${formatWon(preview.refundAmount)} 환불`;

    const revokeLabel =
      preview.revokeScope === "plan_and_credits"
        ? "이용권과 잔여 크레딧도 함께 회수됩니다."
        : "해당 토큰 팩 크레딧도 함께 회수됩니다.";

    if (
      !window.confirm(
        `"${orderName}"에 대해 ${confirmLabel}을 진행하시겠습니까?\n${revokeLabel}`,
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "환불 처리가 완료되었습니다.");
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1200);
      } else {
        setMessage(data.error || "환불 처리에 실패했습니다.");
        if (data.preview) {
          setPreview(data.preview);
        }
      }
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={disabled}>
          <RotateCcw className="h-3.5 w-3.5" />
          환불
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>환불 처리</DialogTitle>
          <DialogDescription>
            {orderName} · {formatWon(amount)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>환불 사유 *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 고객 요청 환불 / 오결제 정정"
              required
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
            {loadingPreview ? (
              <p className="text-zinc-600">환불 규정 계산 중...</p>
            ) : preview ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {preview.paymentKind === "initial_program" ? "올인원 패스" : "토큰 팩"}
                    </p>
                    <p className="text-zinc-600">{preview.reason}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      preview.refundType === "full"
                        ? "bg-emerald-100 text-emerald-700"
                        : preview.refundType === "partial"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {preview.refundType === "full"
                      ? "전액 환불"
                      : preview.refundType === "partial"
                        ? "부분 환불"
                        : "환불 불가"}
                  </span>
                </div>

                <div className="grid gap-2 text-xs text-zinc-700 sm:grid-cols-2">
                  <div className="rounded-md bg-white px-3 py-2">
                    결제 금액
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {formatWon(preview.paymentAmount)}
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    환불 금액
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {formatWon(preview.refundAmount)}
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    경과일
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {preview.elapsedDays}일차
                    </div>
                  </div>
                  <div className="rounded-md bg-white px-3 py-2">
                    크레딧 사용
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      {preview.creditsUsed ? "사용됨" : "미사용"}
                    </div>
                  </div>
                  {preview.lectureThreshold !== null && (
                    <div className="rounded-md bg-white px-3 py-2 sm:col-span-2">
                      강의 열람 수
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {preview.lectureCount}강 / 환불 제한 {preview.lectureThreshold}강
                      </div>
                    </div>
                  )}
                  {preview.penaltyAmount > 0 && preview.refundType === "partial" && (
                    <div className="rounded-md bg-white px-3 py-2 sm:col-span-2">
                      위약금
                      <div className="mt-1 text-sm font-semibold text-zinc-900">
                        {formatWon(preview.penaltyAmount)} (실결제금액의 10%)
                      </div>
                    </div>
                  )}
                </div>

                {preview.warnings.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <AlertTriangle className="h-4 w-4" />
                      확인 필요
                    </div>
                    <ul className="space-y-1">
                      {preview.warnings.map((warning) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-600">미리보기를 불러오지 못했습니다.</p>
            )}
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.includes("완료") || message.includes("처리") || message.includes("회수")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              닫기
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || loadingPreview || !reason.trim() || !preview?.refundable}
              className="flex-1"
            >
              {loading
                ? "처리 중..."
                : preview?.refundType === "partial"
                  ? "규정 환불 실행"
                  : "환불 실행"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
