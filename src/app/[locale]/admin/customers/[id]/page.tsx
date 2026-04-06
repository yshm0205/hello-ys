import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getPlanByVariantId } from "@/lib/lemon/plans";

async function getCustomerDetail(subscriptionId: string) {
  const supabase = createAdminClient();

  // Get subscription with user info
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      "*, user:users(id, email, full_name, avatar_url, created_at)"
    )
    .eq("id", subscriptionId)
    .single();

  if (!subscription) return null;

  const userId = subscription.user_id;

  // Get user's credit info
  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("credits, plan_type, expires_at")
    .eq("user_id", userId)
    .single();

  // Get user's purchase history
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    subscription,
    userPlan,
    purchases: purchases || [],
  };
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
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  const { subscription, userPlan, purchases } = detail;
  const user = subscription.user as {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  const plan = getPlanByVariantId(subscription.plan_id);

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
        {/* Profile */}
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
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("creditBalance")}</p>
                <p className="font-medium">
                  {userPlan?.credits ?? 0} credits ({userPlan?.plan_type || "free"})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("subscriptionInfo")}
              {subscription.lemon_customer_id && (
                <a
                  href={`https://app.lemonsqueezy.com/customers/${subscription.lemon_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-normal text-blue-500 hover:underline flex items-center gap-1"
                >
                  LemonSqueezy <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("status")}</p>
                <Badge
                  variant={
                    subscription.status === "active" ? "default" : "secondary"
                  }
                >
                  {subscription.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">{t("currentPlan")}</p>
                <p className="font-medium">
                  {subscription.plan_name || plan.name}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("startDate")}</p>
                <p className="font-medium">
                  {subscription.created_at
                    ? new Date(subscription.created_at).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("periodEnd")}</p>
                <p className="font-medium">
                  {subscription.current_period_end
                    ? new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("amount")}</p>
                <p className="font-medium">{plan.price}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("creditHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.map(
                (p: {
                  id: string;
                  product_name: string;
                  amount: number;
                  currency: string;
                  status: string;
                  created_at: string;
                }) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {(p.amount / 100).toLocaleString()} {p.currency}
                      </p>
                      <Badge
                        variant={
                          p.status === "completed" ? "default" : "secondary"
                        }
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
            <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
