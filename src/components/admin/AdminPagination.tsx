"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function AdminPagination({
  currentPage,
  totalPages,
}: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingPage, setPendingPage] = useState<number | null>(null);

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setPendingPage(page);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    if (pendingPage !== currentPage) return;
    const timer = window.setTimeout(() => setPendingPage(null), 0);
    return () => window.clearTimeout(timer);
  }, [currentPage, pendingPage]);

  useEffect(() => {
    if (pendingPage === null) return;
    const timer = window.setTimeout(() => setPendingPage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [pendingPage]);

  if (totalPages <= 1) return null;

  const isMovingPrevious = pendingPage === currentPage - 1;
  const isMovingNext = pendingPage === currentPage + 1;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isPending || pendingPage !== null}
        >
          {isMovingPrevious ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <ChevronLeft className="h-4 w-4 mr-1" />
          )}
          {isMovingPrevious ? "이동 중..." : "Previous"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending || pendingPage !== null}
        >
          {isMovingNext ? "이동 중..." : "Next"}
          {isMovingNext ? (
            <Loader2 className="h-4 w-4 ml-1 animate-spin" />
          ) : (
            <ChevronRight className="h-4 w-4 ml-1" />
          )}
        </Button>
      </div>
    </div>
  );
}
