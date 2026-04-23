"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

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

interface RefundPaymentButtonProps {
  paymentKey: string;
  orderName: string;
  amount: number;
  disabled?: boolean;
}

export function RefundPaymentButton({
  paymentKey,
  orderName,
  amount,
  disabled,
}: RefundPaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [partialAmount, setPartialAmount] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isPartial) {
      const parsed = parseInt(partialAmount, 10);
      if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= amount) {
        setMessage("부분 취소 금액은 0보다 크고 결제 금액보다 작아야 합니다.");
        return;
      }
    }

    if (!window.confirm(`"${orderName}" 결제를 정말 취소하시겠습니까? 크레딧도 회수됩니다.`)) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/admin/payments/${encodeURIComponent(paymentKey)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            ...(isPartial ? { amount: parseInt(partialAmount, 10) } : {}),
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "취소가 완료되었습니다.");
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 1200);
      } else {
        setMessage(data.error || "취소 실패");
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
          취소
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>결제 취소</DialogTitle>
          <DialogDescription>
            {orderName} · {amount.toLocaleString("ko-KR")}원
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>취소 사유 *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 고객 요청 환불 / 오결제 정정"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="partial-cancel"
              type="checkbox"
              checked={isPartial}
              onChange={(e) => setIsPartial(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="partial-cancel" className="cursor-pointer text-sm font-normal">
              부분 취소 (금액 직접 입력)
            </Label>
          </div>

          {isPartial && (
            <div className="space-y-2">
              <Label>취소 금액 (원)</Label>
              <Input
                type="number"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder={`최대 ${(amount - 1).toLocaleString("ko-KR")}`}
                min={1}
                max={amount - 1}
                required={isPartial}
              />
              <p className="text-xs text-zinc-500">
                전액 취소하려면 체크 해제하세요.
              </p>
            </div>
          )}

          {message && (
            <p
              className={`text-sm ${
                message.includes("완료") || message.includes("회수")
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
              disabled={loading || !reason.trim()}
              className="flex-1"
            >
              {loading ? "처리 중..." : isPartial ? "부분 취소" : "전액 취소"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
