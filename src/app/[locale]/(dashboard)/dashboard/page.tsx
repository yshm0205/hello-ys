import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation"; // Disabled for Demo Mode
import { DashboardSidebar } from "@/components/features/dashboard/DashboardSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Sparkles, Activity, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { checkIsAdmin } from "@/services/auth/admin";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { redirect } = await import("next/navigation");
    return redirect("/login");
  }

  // Real User Subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();
  // Admin 여부 확인
  const isAdmin = await checkIsAdmin();

  return (
    <DashboardSidebar isAdmin={isAdmin}>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
              {t("title")}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-lg">
              {t("welcome", { name: user?.email?.split("@")[0] || "User" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="hidden sm:flex">
              <Sparkles className="mr-2 h-4 w-4" />
              Quick Action
            </Button>
          </div>
        </div>

        <Separator className="my-6 bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. Subscription Summary Card */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/20 dark:hover:border-blue-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t("cards.subscription.title")}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 tracking-tight">
                {subscription?.plan_name || "Free Plan"}
              </div>
              <div className="flex items-center gap-2 mb-6">
                <Badge
                  variant={
                    subscription?.status === "active" ? "default" : "secondary"
                  }
                  className="text-[10px] px-2 py-0.5 h-5 font-semibold"
                >
                  {subscription?.status === "active"
                    ? t("cards.subscription.active")
                    : t("cards.subscription.inactive")}
                </Badge>
                {subscription?.current_period_end && (
                  <span
                    className="text-xs text-zinc-500"
                    suppressHydrationWarning
                  >
                    {t("cards.subscription.renews", {
                      date: new Date(
                        subscription.current_period_end
                      ).toLocaleDateString(),
                    })}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full relative z-10 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                asChild
              >
                <Link href="/subscription">
                  {t("cards.subscription.manage")}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 2. Usage / Activity Chart */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t("cards.usage.title")}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <Activity className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 tracking-tight">
                0{" "}
                <span className="text-sm font-normal text-zinc-500">reqs</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium mb-4 flex items-center">
                Connect your database to track real usage.
              </p>

              {/* CSS Bar Chart Visualization */}
              <div className="flex items-end gap-2 h-16 pt-2">
                {[40, 60, 45, 70, 50, 80, 65].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-t-sm hover:bg-green-500/80 dark:hover:bg-green-500/80 transition-colors relative group/bar"
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip on hover (simple) */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
                      {height * 10} reqs
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Team / Project Placeholder */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {t("cards.projects.title")}
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1 tracking-tight">
                0{" "}
                <span className="text-sm font-normal text-zinc-500">
                  active
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-normal">
                No active projects found.
              </p>
              <div className="flex -space-x-2 overflow-hidden mb-4">
                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-zinc-950 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-400">
                  +
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                disabled
              >
                {t("cards.projects.button")} →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Section Placeholder */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activity */}
          <Card className="col-span-1 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">
                {t("cards.activity.title")}
              </CardTitle>
              <CardDescription>
                {t("cards.activity.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-24 text-sm text-zinc-500">
                {t("cards.activity.noData") || "No recent activity found."}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Tips */}
          <Card className="col-span-1 border-dashed bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-300 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                {t("cards.customize.title")}
              </CardTitle>
              <CardDescription>
                {t("cards.customize.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-3 bg-white dark:bg-zinc-900/50 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <p>
                  {t.rich("cards.customize.tips.one", {
                    strong: (chunks) => (
                      <strong className="text-zinc-900 dark:text-zinc-200">
                        {chunks}
                      </strong>
                    ),
                  })}
                </p>
                <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                <p>
                  {t.rich("cards.customize.tips.two", {
                    strong: (chunks) => (
                      <strong className="text-zinc-900 dark:text-zinc-200">
                        {chunks}
                      </strong>
                    ),
                  })}
                </p>
                <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                <p>
                  {t.rich("cards.customize.tips.three", {
                    strong: (chunks) => (
                      <strong className="text-zinc-900 dark:text-zinc-200">
                        {chunks}
                      </strong>
                    ),
                    code: (chunks) => (
                      <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono text-pink-600 dark:text-pink-400 border border-zinc-200 dark:border-zinc-700">
                        {chunks}
                      </code>
                    ),
                  })}
                </p>
              </div>
              <Button size="sm" asChild className="w-full">
                <Link href="/settings">{t("cards.customize.button")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardSidebar>
  );
}
