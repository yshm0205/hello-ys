import {
  Banknote,
  CalendarDays,
  Minus,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import {
  buildWeeklySalesRows,
  getWeeklySalesQueryRange,
  type WeeklySalesPayment,
} from "@/lib/admin/weekly-sales";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REPORT_WEEK_COUNT = 12;
const SEOUL_TIME_ZONE = "Asia/Seoul";

interface PaymentRow extends WeeklySalesPayment {
  readonly user_id: string;
}

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TIME_ZONE,
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatWeekLabel(weekStart: Date, weekEnd: Date) {
  const inclusiveEnd = new Date(weekEnd.getTime() - 1);
  return `${formatShortDate(weekStart)} - ${formatShortDate(inclusiveEnd)}`;
}

function getChangeTone(value: number) {
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-rose-700";
  return "text-zinc-500";
}

function ChangeIcon({ value }: { readonly value: number }) {
  if (value > 0) return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
  if (value < 0) return <TrendingDown className="h-4 w-4" aria-hidden="true" />;
  return <Minus className="h-4 w-4" aria-hidden="true" />;
}

function formatSignedCount(value: number) {
  if (value > 0) return `+${value}건`;
  return `${value}건`;
}

function formatSignedWon(value: number) {
  if (value > 0) return `+${formatWon(value)}`;
  return formatWon(value);
}

export default async function AdminWeeklySalesPage() {
  const now = new Date();
  const range = getWeeklySalesQueryRange(now, REPORT_WEEK_COUNT);
  const supabase = createAdminClient();

  const [internalAdmins, paymentResponse] = await Promise.all([
    getInternalAdminUsers(),
    supabase
      .from("toss_payments")
      .select("created_at, user_id, amount, status, metadata")
      .in("status", ["DONE", "PARTIAL_CANCELLED"])
      .gte("created_at", range.start.toISOString())
      .lt("created_at", range.end.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  if (paymentResponse.error) {
    throw paymentResponse.error;
  }

  const internalAdminIds = new Set(internalAdmins.map((user) => user.id));
  const externalPayments = ((paymentResponse.data || []) as PaymentRow[]).filter(
    (payment) => !internalAdminIds.has(payment.user_id),
  );
  const weeklyRows = buildWeeklySalesRows(externalPayments, now, REPORT_WEEK_COUNT);
  const currentWeek = weeklyRows[0];
  const previousWeek = weeklyRows[1];
  const salesChange = currentWeek.salesCount - previousWeek.salesCount;
  const revenueChange = currentWeek.netRevenue - previousWeek.netRevenue;
  const maxWeeklyRevenue = Math.max(...weeklyRows.map((row) => row.netRevenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">주간 판매</h1>
        <p className="mt-2 text-sm text-zinc-500">
          이번 주 실결제와 최근 12주 판매 흐름을 빠르게 확인합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="gap-4 py-5">
          <CardHeader className="flex grid-cols-[1fr_auto] items-start gap-4 px-5 pb-0">
            <div>
              <CardDescription>이번 주 판매</CardDescription>
              <CardTitle className="mt-2 text-2xl">{currentWeek.salesCount}건</CardTitle>
            </div>
            <div className="rounded-md bg-zinc-100 p-2 text-zinc-700">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <p className={`flex items-center gap-1.5 text-sm font-medium ${getChangeTone(salesChange)}`}>
              <ChangeIcon value={salesChange} />
              지난주보다 {formatSignedCount(salesChange)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="flex grid-cols-[1fr_auto] items-start gap-4 px-5 pb-0">
            <div>
              <CardDescription>이번 주 순매출</CardDescription>
              <CardTitle className="mt-2 text-2xl">{formatWon(currentWeek.netRevenue)}</CardTitle>
            </div>
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <p className={`flex items-center gap-1.5 text-sm font-medium ${getChangeTone(revenueChange)}`}>
              <ChangeIcon value={revenueChange} />
              지난주보다 {formatSignedWon(revenueChange)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4 py-5">
          <CardHeader className="flex grid-cols-[1fr_auto] items-start gap-4 px-5 pb-0">
            <div>
              <CardDescription>현재 집계 주차</CardDescription>
              <CardTitle className="mt-2 text-xl">
                {formatWeekLabel(currentWeek.weekStart, currentWeek.weekEnd)}
              </CardTitle>
            </div>
            <div className="rounded-md bg-violet-50 p-2 text-violet-700">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-sm text-zinc-500">일요일 00:00부터 토요일 23:59까지</p>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-5 py-5 md:px-6">
          <CardTitle>최근 12주 판매 내역</CardTitle>
          <CardDescription>
            결제 완료와 부분 환불의 잔여 금액을 합산한 순매출입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-6 py-3">주차</th>
                  <th className="px-6 py-3 text-right">판매량</th>
                  <th className="px-6 py-3 text-right">순매출</th>
                  <th className="w-56 px-6 py-3">매출 흐름</th>
                </tr>
              </thead>
              <tbody>
                {weeklyRows.map((row, index) => {
                  const barWidth = `${Math.round((row.netRevenue / maxWeeklyRevenue) * 100)}%`;
                  return (
                    <tr
                      key={row.weekStart.toISOString()}
                      className={index === 0 ? "border-t bg-violet-50/60" : "border-t bg-white"}
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900">
                        <span>{formatWeekLabel(row.weekStart, row.weekEnd)}</span>
                        {index === 0 && <Badge className="ml-2 bg-violet-600">이번 주</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-zinc-900">
                        {row.salesCount}건
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-zinc-900">
                        {formatWon(row.netRevenue)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={index === 0 ? "h-full bg-violet-600" : "h-full bg-zinc-700"}
                            style={{ width: barWidth }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="divide-y md:hidden">
            {weeklyRows.map((row, index) => (
              <div
                key={row.weekStart.toISOString()}
                className={index === 0 ? "bg-violet-50/60 px-5 py-4" : "px-5 py-4"}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-zinc-900">
                    {formatWeekLabel(row.weekStart, row.weekEnd)}
                  </p>
                  {index === 0 && <Badge className="bg-violet-600">이번 주</Badge>}
                </div>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-zinc-500">판매량</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">{row.salesCount}건</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">순매출</p>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                      {formatWon(row.netRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs leading-5 text-zinc-500">
        내부·테스트 계정과 취소 완료 건은 제외됩니다. 계좌이체 후 결제 기록 없이 수기로 권한만
        지급한 건은 이 집계에 포함되지 않습니다.
      </p>
    </div>
  );
}
