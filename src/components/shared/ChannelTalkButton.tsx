"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MessageCircleMore } from "lucide-react";
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

export function ChannelTalkButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
      customLauncherSelector: "#channel-talk-launcher",
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

  if (!CHANNEL_TALK_PLUGIN_KEY || isLecturePlayer) {
    return null;
  }

  return (
    <button
      id="channel-talk-launcher"
      type="button"
      aria-label="채널톡 문의"
      className={`fixed ${
        isLandingRoot
          ? "bottom-[calc(env(safe-area-inset-bottom)+108px)]"
          : "bottom-[calc(env(safe-area-inset-bottom)+76px)]"
      } right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:h-14 md:w-14`}
    >
      <MessageCircleMore className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.2} />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#10b981] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-sm">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
