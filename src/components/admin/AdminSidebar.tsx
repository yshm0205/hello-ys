"use client";

import type { AdminAccessLevel } from "@/lib/admin/access";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Footprints,
  GraduationCap,
  Flame,
  Star,
  Ticket,
  LifeBuoy,
  Webhook,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
}

interface NavGroup {
  titleKey: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    titleKey: "nav.dashboard",
    items: [
      {
        href: "/admin/overview",
        labelKey: "overview.title",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        href: "/admin/activity",
        labelKey: "activity.title",
        icon: <Activity className="h-4 w-4" />,
      },
      {
        href: "/admin/sessions",
        labelKey: "sessions.title",
        icon: <Footprints className="h-4 w-4" />,
      },
    ],
  },
  {
    titleKey: "nav.revenue",
    items: [
      {
        href: "/admin/sales",
        labelKey: "sales.title",
        icon: <DollarSign className="h-4 w-4" />,
      },
      {
        href: "/admin/credits",
        labelKey: "credits.title",
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    titleKey: "nav.customers",
    items: [
      {
        href: "/admin/customers",
        labelKey: "customers.title",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    titleKey: "nav.content",
    items: [
      {
        href: "/admin/lectures",
        labelKey: "lectures.title",
        icon: <GraduationCap className="h-4 w-4" />,
      },
      {
        href: "/admin/reviews",
        labelKey: "reviews.title",
        icon: <Star className="h-4 w-4" />,
      },
      {
        href: "/admin/feedback-requests",
        labelKey: "feedbackRequests.title",
        icon: <Ticket className="h-4 w-4" />,
      },
      {
        href: "/admin/hot-list",
        labelKey: "hotList.title",
        icon: <Flame className="h-4 w-4" />,
      },
    ],
  },
  {
    titleKey: "nav.system",
    items: [
      {
        href: "/admin/tickets",
        labelKey: "tickets.title",
        icon: <LifeBuoy className="h-4 w-4" />,
      },
      {
        href: "/admin/webhooks",
        labelKey: "webhooks.title",
        icon: <Webhook className="h-4 w-4" />,
      },
    ],
  },
];

export function AdminSidebar({
  accessLevel = "full",
}: {
  accessLevel?: AdminAccessLevel;
}) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    // Remove locale prefix for matching
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, "");
    return cleanPath === href || cleanPath.startsWith(href + "/");
  };

  const visibleGroups =
    accessLevel === "marketing"
      ? navGroups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => item.href === "/admin/overview"),
          }))
          .filter((group) => group.items.length > 0)
      : navGroups;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h2 className="text-lg font-bold tracking-tight">Admin</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {visibleGroups.map((group) => (
          <div key={group.titleKey}>
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {t(group.titleKey)}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  } ${collapsed ? "justify-center" : ""}`}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? t("backToDashboard") : undefined}
        >
          <ArrowLeft className="h-4 w-4" />
          {!collapsed && <span>{t("backToDashboard")}</span>}
        </Link>
        <div className={`flex ${collapsed ? "justify-center" : "px-3"}`}>
          <span className="text-xs text-zinc-400">v1.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 h-9 w-9 p-0"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 md:z-auto
          h-screen bg-white border-r border-zinc-200
          transition-all duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${collapsed ? "w-16" : "w-60"}
        `}
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-4 right-4 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        {sidebarContent}
      </aside>
    </>
  );
}
