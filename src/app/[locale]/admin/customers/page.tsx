import { createAdminClient } from "@/utils/supabase/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminFilter } from "@/components/admin/AdminFilter";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Link } from "@/i18n/routing";

interface Customer {
  user_id: string;
  credits: number;
  plan_type: string;
  expires_at: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
  } | null;
}

async function getCustomers(filters?: {
  q?: string;
  planType?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Customer[]; totalPages: number }> {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("user_plans")
    .select(
      "user_id, credits, plan_type, expires_at, user:users(id, email, full_name, created_at)",
      { count: "exact" }
    )
    .order("credits", { ascending: false });

  if (filters?.planType && filters.planType !== "all") {
    query = query.eq("plan_type", filters.planType);
  }

  const { data, count } = await query.range(from, to);

  const mapped = (data || []).map((item: Record<string, unknown>) => {
    const userArr = item.user as
      | { id: string; email: string; full_name: string | null; created_at: string }[]
      | null;
    const userInfo = Array.isArray(userArr) ? userArr[0] : null;
    return {
      user_id: item.user_id as string,
      credits: item.credits as number,
      plan_type: item.plan_type as string,
      expires_at: item.expires_at as string | null,
      user: userInfo,
    };
  });

  let filtered = mapped;
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter((item) =>
      item.user?.email?.toLowerCase().includes(q)
    );
  }

  return {
    data: filtered,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

const planLabels: Record<string, string> = {
  free: "무료",
  pro: "Pro",
  allinone: "올인원",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; planType?: string; page?: string }>;
}) {
  const { q, planType, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const { data: customers, totalPages } = await getCustomers({
    q,
    planType,
    page: currentPage,
  });
  const t = await getTranslations("Admin.customers");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <AdminSearch placeholder="이메일 검색..." />
        <AdminFilter
          name="planType"
          placeholder="전체 플랜"
          options={[
            { label: "무료", value: "free" },
            { label: "Pro", value: "pro" },
            { label: "올인원", value: "allinone" },
          ]}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>플랜</TableHead>
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
                    <div className="font-medium">{customer.user?.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.user?.full_name || ""}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      customer.plan_type === "allinone"
                        ? "default"
                        : customer.plan_type === "pro"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {planLabels[customer.plan_type] || customer.plan_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {customer.credits}cr
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {customer.user?.created_at
                    ? new Date(customer.user.created_at).toLocaleDateString("ko-KR")
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {customer.expires_at
                    ? new Date(customer.expires_at).toLocaleDateString("ko-KR")
                    : "-"}
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
