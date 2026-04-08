import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

const planLabels: Record<string, string> = {
  free: "무료",
  pro: "Pro",
  allinone: "올인원",
};

async function getCustomerDetail(userId: string) {
  const supabase = createAdminClient();

  // 사용자 정보
  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at")
    .eq("id", userId)
    .single();

  if (!user) return null;

  // 크레딧/플랜 정보
  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("credits, plan_type, expires_at")
    .eq("user_id", userId)
    .single();

  // 토스 결제 내역
  const { data: payments } = await supabase
    .from("toss_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return { user, userPlan, payments: payments || [] };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  const t = await getTranslations("Admin.customers");

  if (!detail) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/customers"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <p className="text-muted-foreground">사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { user, userPlan, payments } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("detailTitle")}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 프로필 */}
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {user.full_name || user.email}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("joinedAt")}</p>
                <p className="font-medium">
                  {new Date(user.created_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("creditBalance")}</p>
                <p className="font-medium">
                  {userPlan?.credits ?? 0}cr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 플랜 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>플랜 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">플랜</p>
                <Badge variant={userPlan?.plan_type === "free" ? "secondary" : "default"}>
                  {planLabels[userPlan?.plan_type || "free"] || userPlan?.plan_type}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">크레딧 잔액</p>
                <p className="font-medium">{userPlan?.credits ?? 0}cr</p>
              </div>
              <div>
                <p className="text-muted-foreground">만료일</p>
                <p className="font-medium">
                  {userPlan?.expires_at
                    ? new Date(userPlan.expires_at).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 결제 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map(
                (p: {
                  id: string;
                  order_name: string;
                  amount: number;
                  credits: number;
                  status: string;
                  created_at: string;
                }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.order_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {p.amount.toLocaleString("ko-KR")}원 (+{p.credits}cr)
                      </p>
                      <Badge
                        variant={p.status === "DONE" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">결제 내역이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
