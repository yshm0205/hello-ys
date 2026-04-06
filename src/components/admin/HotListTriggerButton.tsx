"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Flame, Loader2 } from "lucide-react";

export function HotListTriggerButton() {
  const t = useTranslations("Admin.hotList");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleTrigger() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/cron/hot-trends", {
        method: "POST",
      });

      if (res.ok) {
        setMessage(t("triggerSuccess"));
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage(t("triggerError"));
      }
    } catch {
      setMessage(t("triggerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <p
          className={`text-sm ${
            message.includes("success") || message.includes("시작")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
      <Button
        onClick={handleTrigger}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Flame className="h-4 w-4" />
        )}
        {loading ? t("collecting") : t("collectNow")}
      </Button>
    </div>
  );
}
