"use client";

import {
  Home,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/routing";
import { logout } from "@/services/auth/actions";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// SSR-safe 마운트 상태 감지 (Hydration mismatch 방지)
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function DashboardSidebar({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = useTranslations("Dashboard.sidebar");

  // SSR-safe 마운트 상태 감지 (Hydration mismatch 방지)
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot
  );

  // 서버와 클라이언트 첫 렌더링 동일하게 유지
  if (!isMounted) {
    return (
      <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
        <aside className="hidden md:flex flex-col border-r bg-zinc-50 dark:bg-zinc-950 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-10 w-64">
          <div className="h-16 flex items-center px-4 border-b justify-between">
            <span className="text-xl font-bold truncate">SaaS Kit</span>
          </div>
          <nav className="flex-1 px-3 space-y-2 mt-4" />
          <div className="p-3 border-t mt-auto space-y-2" />
        </aside>
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out md:ml-64">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 shadow-sm" />
          <main className="flex-1 p-6 md:p-8 pt-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-zinc-50 dark:bg-zinc-950 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-10",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className={cn(
            "h-16 flex items-center px-4 border-b",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <span className="text-xl font-bold truncate">SaaS Kit</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8", isCollapsed ? "" : "ml-auto")}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          <SidebarNav isCollapsed={isCollapsed} isAdmin={isAdmin} />
        </nav>
        <div className="p-3 border-t mt-auto space-y-2">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "px-2"
            )}
          >
            <ThemeToggle />
            {!isCollapsed && (
              <span className="ml-2 text-sm text-muted-foreground font-medium">
                Theme Mode
              </span>
            )}
          </div>
          <form action={logout}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30",
                isCollapsed && "justify-center px-0"
              )}
              type="submit"
            >
              <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && t("logout")}
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          "md:ml-64", // Default margin
          isCollapsed && "md:ml-16" // Collapsed margin
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 shadow-sm">
          {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-6">
                <h2 className="text-2xl font-bold">{t("menu")}</h2>
              </div>
              <nav className="px-4 space-y-2">
                <SidebarNav isAdmin={isAdmin} />
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t space-y-2">
                <div className="flex items-center px-2 py-2">
                  <ThemeToggle />
                  <span className="ml-2 text-sm font-medium">Theme Mode</span>
                </div>
                <form action={logout}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    type="submit"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold md:hidden">{t("dashboard")}</h1>

          {/* Right Side Actions */}
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            {/* Add UserMenu here later if needed */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 pt-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  isCollapsed = false,
  isAdmin = false,
}: {
  isCollapsed?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard.sidebar");

  const links = [
    { href: "/dashboard", label: t("dashboard"), icon: Home },
    { href: "/settings", label: t("settings"), icon: Settings },
    { href: "/subscription", label: t("subscription"), icon: CreditCard },
    // Admin 링크는 isAdmin일 때만 포함
    ...(isAdmin
      ? [{ href: "/admin/overview", label: "Admin", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-1 py-2">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Button
            key={link.href}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start transition-all relative group",
              isActive
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100",
              isCollapsed
                ? "justify-center px-0 h-10 w-10 mx-auto mb-1"
                : "px-3"
            )}
            asChild
            title={isCollapsed ? link.label : undefined}
          >
            <Link href={link.href}>
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
              <link.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  !isCollapsed && "mr-3",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                )}
              />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
