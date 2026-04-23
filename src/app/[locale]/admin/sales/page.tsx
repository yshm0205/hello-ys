import { createAdminClient } from "@/utils/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { RefundPaymentButton } from "@/components/admin/RefundPaymentButton";

interface TossPayment {
  id: string;
  created_at: string;
  order_name: string;
  order_id: string;
  amount: number;
  credits: number;
  status: string;
  payment_key: string | null;
  user: {
    email: string;
  } | null;
}

const CANCELLABLE_STATUSES = new Set(["DONE"]);

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const t = await getTranslations("Admin.sales");
  const supabase = createAdminClient();

  let query = supabase
    .from("toss_payments")
    .select("*, user:users!toss_payments_user_id_public_users_fkey(email)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`order_name.ilike.%${q}%,order_id.ilike.%${q}%`);
  }

  const { data: payments, count } = await query.range(from, to);
  const totalPages = Math.ceil((count || 0) / pageSize);

  // 통계
  const { data: allPayments } = await supabase
    .from("toss_payments")
    .select("amount, credits");

  const totalRevenue = allPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalCredits = allPayments?.reduce((sum, p) => sum + p.credits, 0) || 0;
  const totalCount = allPayments?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-zinc-500 mt-2">
            {t("description")}
          </p>
        </div>
        <AdminSearch placeholder="주문명 또는 주문번호 검색..." />
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString("ko-KR")}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 판매 크레딧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits.toLocaleString()}cr</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 거래 건수</CardTitle>
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
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">{t("colDate")}</th>
                  <th className="px-4 py-3">{t("colCustomer")}</th>
                  <th className="px-4 py-3">{t("colProduct")}</th>
                  <th className="px-4 py-3">크레딧</th>
                  <th className="px-4 py-3">{t("colAmount")}</th>
                  <th className="px-4 py-3">{t("colStatus")}</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">관리</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {payments && payments.length > 0 ? (
                  (payments as unknown as TossPayment[]).map((payment) => (
                    <tr
                      key={payment.id}
                      className="bg-white border-b"
                    >
                      <td className="px-4 py-3">
                        {new Date(payment.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3">
                        {payment.user?.email || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {payment.order_name}
                        <span className="block text-xs text-zinc-500">
                          {payment.order_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        +{payment.credits}cr
                      </td>
                      <td className="px-4 py-3">
                        {payment.amount.toLocaleString("ko-KR")}원
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={payment.status === "DONE" ? "default" : "secondary"}
                        >
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
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-zinc-500"
                    >
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
