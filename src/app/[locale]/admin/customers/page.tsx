import { getTranslations } from "next-intl/server";

import { AdminFilter } from "@/components/admin/AdminFilter";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { getPaginatedUserPlans } from "@/lib/admin/user-plans";
import { getPlanLabel, PLAN_TYPE } from "@/lib/plans/config";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; planType?: string; page?: string }>;
}) {
  const { q, planType, page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const t = await getTranslations("Admin.customers");

  const { data: customers, totalPages } = await getPaginatedUserPlans({
    q,
    planType,
    page: currentPage,
    pageSize: 10,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <AdminSearch placeholder="이메일 검색..." />
        <AdminFilter
          name="planType"
          placeholder="전체 이용권"
          options={[
            { label: "무료", value: PLAN_TYPE.FREE },
            { label: "4개월 프로그램", value: PLAN_TYPE.STUDENT_4M },
            { label: "월 구독", value: PLAN_TYPE.SUBSCRIBER_MONTHLY },
            { label: "구 올인원", value: PLAN_TYPE.LEGACY_ALLINONE },
            { label: "구 Pro", value: PLAN_TYPE.LEGACY_PRO },
          ]}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>이용권</TableHead>
              <TableHead className="text-right">크레딧</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>만료일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.user_id}>
                <TableCell>
                  <Link
                    href={`/admin/customers/${customer.user_id}`}
                    className="hover:underline"
                  >
                    <div className="font-medium">{customer.user?.email || customer.user_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.user?.full_name || ""}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={customer.plan_type === PLAN_TYPE.FREE ? "secondary" : "default"}
                  >
                    {getPlanLabel(customer.plan_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {customer.credits}cr
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(customer.user?.created_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(customer.expires_at)}
                </TableCell>
              </TableRow>
            ))}
            {!customers.length && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t("noCustomers")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdminPagination currentPage={currentPage} totalPages={totalPages} />
    </div>
  );
}
