import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Activity, FileText, Coins, UserPlus } from "lucide-react";

async function getActivityStats() {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // New users today
  const { count: newUsersToday } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayISO);

  // Total users
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  return {
    newUsersToday: newUsersToday || 0,
    totalUsers: totalUsers || 0,
  };
}

async function getUserList(filters?: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (filters?.q) {
    query = query.ilike("email", `%${filters.q}%`);
  }

  const { data: users, count } = await query.range(from, to);

  // Get credit info for each user
  const userIds = (users || []).map((u) => u.id);
  const { data: plans } = await supabase
    .from("user_plans")
    .select("user_id, credits, plan_type")
    .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

  const planMap = new Map(
    (plans || []).map((p) => [p.user_id, p])
  );

  const enrichedUsers = (users || []).map((u) => ({
    ...u,
    plan: planMap.get(u.id) || null,
  }));

  return {
    data: enrichedUsers,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const t = await getTranslations("Admin.activity");

  const [stats, users] = await Promise.all([
    getActivityStats(),
    getUserList({ q, page: currentPage }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dau")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">{t("dauDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("scriptsToday")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">{t("scriptsDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("creditsUsedToday")}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">-</div>
            <p className="text-xs text-muted-foreground">{t("creditsDesc")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("newUsers")}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersToday}</div>
            <p className="text-xs text-muted-foreground">
              {t("newUsersDesc")} (Total: {stats.totalUsers})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("userList")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminSearch placeholder="Search email..." />

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("planType")}</TableHead>
                  <TableHead className="text-right">{t("credits")}</TableHead>
                  <TableHead>{t("joinedAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.full_name || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.plan ? "default" : "secondary"}>
                        {user.plan?.plan_type || "none"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {user.plan?.credits ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {!users.data.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {t("noUsers")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            currentPage={currentPage}
            totalPages={users.totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
