"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { useRouter } from "@/i18n/routing";

const REFRESH_INTERVAL_MS = 30000;

export function AdminOverviewLiveRefresh() {
  const router = useRouter();
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => {
      router.refresh();
      setLastRefreshedAt(new Date());
    };

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <RefreshCw className="h-3.5 w-3.5" />
      <span>30초마다 자동으로 최신 데이터로 갱신됩니다.</span>
      {lastRefreshedAt ? (
        <span>마지막 갱신 {lastRefreshedAt.toLocaleTimeString("ko-KR")}</span>
      ) : null}
    </div>
  );
}
