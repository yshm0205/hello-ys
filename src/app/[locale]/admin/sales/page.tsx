import { getTranslations } from "next-intl/server";

import { RefundPaymentButton } from "@/components/admin/RefundPaymentButton";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { createAdminClient } from "@/utils/supabase/admin";

interface TossPayment {
  id: string;
  created_at: string;
  user_id: string;
  order_name: string;
  order_id: string;
  amount: number;
  credits: number;
  status: string;
  payment_key: string | null;
  metadata?: Record<string, unknown> | null;
  user: {
    email: string;
  } | null;
}

const CANCELLABLE_STATUSES = new Set(["DONE"]);
const SALES_STATUSES = ["DONE", "PARTIAL_CANCELLED"] as const;

function getNumericMetadata(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getNetRevenue(payment: TossPayment) {
  if (payment.status === "DONE") {
    return payment.amount;
  }

  const cancelledAmount = getNumericMetadata(payment.metadata, "cancelledAmount");
  return Math.max(0, payment.amount - cancelledAmount);
}

function getNetCredits(payment: TossPayment) {
  if (payment.status === "DONE") {
    return payment.credits;
  }

  const revokedCredits = getNumericMetadata(payment.metadata, "revokedCredits");
  return Math.max(0, payment.credits - revokedCredits);
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const t = await getTranslations("Admin.sales");
  const supabase = createAdminClient();
  const internalAdmins = await getInternalAdminUsers();
  const internalAdminIds = new Set(internalAdmins.map((user) => user.id));

  const { data: paymentRows } = await supabase
    .from("toss_payments")
    .select("*, user:users!toss_payments_user_id_public_users_fkey(email)")
    .in("status", [...SALES_STATUSES])
    .order("created_at", { ascending: false });

  const externalPayments = ((paymentRows || []) as TossPayment[]).filter(
    (payment) => !internalAdminIds.has(payment.user_id),
  );

  const keyword = q?.trim().toLowerCase() || "";
  const searchedPayments = keyword
    ? externalPayments.filter((payment) => {
        const email = payment.user?.email?.toLowerCase() || "";
        return (
          payment.order_name.toLowerCase().includes(keyword) ||
          payment.order_id.toLowerCase().includes(keyword) ||
          email.includes(keyword)
        );
      })
    : externalPayments;

  const payments = searchedPayments.slice(from, to + 1);
  const totalPages = Math.max(1, Math.ceil(searchedPayments.length / pageSize));

  const totalRevenue = externalPayments.reduce((sum, payment) => sum + getNetRevenue(payment), 0);
  const totalCredits = externalPayments.reduce((sum, payment) => sum + getNetCredits(payment), 0);
  const totalCount = externalPayments.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-zinc-500">{t("description")}</p>
        </div>
        <AdminSearch placeholder="주문명, 주문번호, 이메일 검색" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <CardDescription>내부 계정 제외 기준</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString("ko-KR")}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 판매 크레딧</CardTitle>
            <CardDescription>내부 계정 제외 기준</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits.toLocaleString("ko-KR")}cr</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 거래 건수</CardTitle>
            <CardDescription>내부 계정 제외 기준</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}건</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="rounded-l-lg px-4 py-3">{t("colDate")}</th>
                  <th className="px-4 py-3">{t("colCustomer")}</th>
                  <th className="px-4 py-3">{t("colProduct")}</th>
                  <th className="px-4 py-3">크레딧</th>
                  <th className="px-4 py-3">{t("colAmount")}</th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                  <th className="rounded-r-lg px-4 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b bg-white">
                      <td className="px-4 py-3">
                        {new Date(payment.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3">{payment.user?.email || "-"}</td>
                      <td className="px-4 py-3 font-medium">
                        {payment.order_name}
                        <span className="block text-xs text-zinc-500">{payment.order_id}</span>
                      </td>
                      <td className="px-4 py-3">+{payment.credits}cr</td>
                      <td className="px-4 py-3">{payment.amount.toLocaleString("ko-KR")}원</td>
                      <td className="px-4 py-3">
                        <Badge variant={payment.status === "DONE" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {payment.payment_key && CANCELLABLE_STATUSES.has(payment.status) ? (
                          <RefundPaymentButton
                            paymentKey={payment.payment_key}
                            orderName={payment.order_name}
                            amount={payment.amount}
                          />
                        ) : payment.status === "PENDING" ? (
                          <span className="text-xs text-zinc-400">미결제</span>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      결제 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AdminPagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
