"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageCircleMore, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  boot,
  loadScript,
  onBadgeChanged,
  setPage,
  shutdown,
} from "@channel.io/channel-web-sdk-loader";

import { createClient } from "@/utils/supabase/client";

const CHANNEL_TALK_PLUGIN_KEY =
  process.env.NEXT_PUBLIC_CHANNEL_TALK_PLUGIN_KEY || "";

function getDisplayName(user: User | null) {
  if (!user) return undefined;

  const metadata = user.user_metadata || {};
  return (
    metadata.full_name ||
    metadata.name ||
    (typeof user.email === "string" ? user.email.split("@")[0] : undefined)
  );
}

const TOOLTIP_DISMISS_KEY = "flowspot_ct_tip_dismissed_at";
const TOOLTIP_DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function ChannelTalkButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const isLecturePlayer = /\/lectures\/vod_/.test(pathname);
  const isLandingRoot = /^\/[a-z]{2}\/?$/.test(pathname) || pathname === "/";
  const locale = pathname.startsWith("/ko") ? "ko" : "en";

  const pagePath = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!CHANNEL_TALK_PLUGIN_KEY) return;

    const supabase = createClient();
    let active = true;

    const syncUser = async () => {
      const {
        data: { user: nextUser },
      } = await supabase.auth.getUser();

      if (!active) return;
      setUser(nextUser ?? null);
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!CHANNEL_TALK_PLUGIN_KEY) return;

    loadScript();

    boot({
      pluginKey: CHANNEL_TALK_PLUGIN_KEY,
      customLauncherSelector: "#channel-talk-launcher, #channel-talk-launcher-tooltip",
      hideChannelButtonOnBoot: true,
      language: locale,
      memberId: user?.id,
      profile: user
        ? {
            email: user.email ?? "",
            mobileNumber: user.phone ?? "",
            name: getDisplayName(user) ?? "",
          }
        : undefined,
    });

    onBadgeChanged((count) => {
      setUnreadCount(Math.max(0, count));
    });

    return () => {
      shutdown();
    };
  }, [locale, user?.email, user?.id, user?.phone]);

  useEffect(() => {
    if (!CHANNEL_TALK_PLUGIN_KEY) return;
    setPage(pagePath);
  }, [pagePath]);

  useEffect(() => {
    if (!CHANNEL_TALK_PLUGIN_KEY) return;
    if (typeof window === "undefined") return;

    const dismissedAt = Number(window.localStorage.getItem(TOOLTIP_DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < TOOLTIP_DISMISS_TTL_MS) {
      return;
    }

    const timer = window.setTimeout(() => setTooltipVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleDismissTooltip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOOLTIP_DISMISS_KEY, String(Date.now()));
    }
  };

  if (!CHANNEL_TALK_PLUGIN_KEY || isLecturePlayer) {
    return null;
  }

  const bottomOffset = isLandingRoot
    ? "bottom-[calc(env(safe-area-inset-bottom)+108px)]"
    : "bottom-[calc(env(safe-area-inset-bottom)+76px)]";

  return (
    <div
      className={`fixed ${bottomOffset} right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6`}
    >
      {tooltipVisible && (
        <div className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-1 rounded-2xl bg-[#1f2937]/95 py-2.5 pl-4 pr-1.5 text-white shadow-lg backdrop-blur-sm duration-300">
          <button
            type="button"
            id="channel-talk-launcher-tooltip"
            className="flex flex-col items-start text-left"
            aria-label="채널톡 문의 열기"
          >
            <span className="text-[13px] font-semibold leading-tight">
              FlowSpot, 궁금한 건 채팅으로
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
              <MessageCircleMore className="h-3 w-3" strokeWidth={2.4} />
              대화 시작하기
            </span>
          </button>
          <button
            type="button"
            onClick={handleDismissTooltip}
            aria-label="안내 닫기"
            className="ml-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white/90"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      )}

      <button
        id="channel-talk-launcher"
        type="button"
        aria-label="채널톡 문의"
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#8b5cf6] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:h-14 md:w-14"
      >
        <MessageCircleMore className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#10b981] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
