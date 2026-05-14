"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function AdminSearch({ placeholder }: { placeholder: string }) {
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(searchParams.get("q")?.toString() || "");
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setTerm(searchParams.get("q")?.toString() || "");
  }, [searchParams]);

  useEffect(() => {
    const current = searchParams.get("q")?.toString() || "";
    if (term === current) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = window.setTimeout(() => {
      setIsDebouncing(false);
      handleSearch(term);
    }, 300);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  function handleSearch(nextTerm: string) {
    const params = new URLSearchParams(searchParams);
    if (nextTerm) {
      params.set("q", nextTerm);
    } else {
      params.delete("q");
    }
    params.delete("page");
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-8 h-9"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {(isPending || isDebouncing) && (
        <div className="absolute right-2.5 top-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
