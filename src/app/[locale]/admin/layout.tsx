import { createClient } from "@/utils/supabase/server";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email === undefined || user.email === null) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    return null; // unreachable but for TS
  }

  const userEmail: string = user.email;
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

  if (!adminEmails.includes(userEmail)) {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
    return null;
  }

  const t = await getTranslations("Admin");

  return (
    <div className="w-full min-h-fit bg-zinc-50 dark:bg-zinc-950 pb-12">
      <div className="container mx-auto p-6 md:p-8 max-w-7xl space-y-6">
        {/* Admin Navigation Tabs */}
        <nav className="flex gap-4 border-b pb-4">
          <Link
            href="/admin/overview"
            className="text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("overview.title")}
          </Link>
          <Link
            href="/admin/customers"
            className="text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("customers.title")}
          </Link>
          <Link
            href="/admin/webhooks"
            className="text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("webhooks.title")}
          </Link>
          <Link
            href="/admin/sales"
            className="text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("sales.title")}
          </Link>
          <Link
            href="/admin/tickets"
            className="text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("tickets.title")}
          </Link>
          <Link
            href="/dashboard"
            className="ml-auto text-sm font-medium px-4 py-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            {t("backToDashboard")}
          </Link>
          <div className="flex items-center pl-2 border-l ml-2">
            <ThemeToggle />
          </div>
        </nav>

        {children}
      </div>
    </div>
  );
}
