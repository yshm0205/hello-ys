"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AdminFeedbackRow = {
  id: string;
  user_id: string;
  review_id: string | null;
  request_type: string;
  title: string;
  description: string;
  reference_url: string | null;
  status: string;
  admin_note: string | null;
  admin_response: string | null;
  responded_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  users: { email: string | null; full_name: string | null } | null;
  reviews: {
    headline: string | null;
    channel_name: string | null;
    feedback_tickets_remaining: number;
    feedback_tickets_granted: number;
  } | null;
};

const TYPE_LABELS: Record<string, string> = {
  channel: "채널 방향",
  topic: "주제 기획",
  script: "스크립트",
  other: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "접수됨",
  in_progress: "검토 중",
  answered: "답변 완료",
  closed: "종료",
  rejected: "반려",
};

const STATUS_ORDER = ["submitted", "in_progress", "answered", "closed", "rejected"] as const;

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FeedbackRequestsAdminClient() {
  const [rows, setRows] = useState<AdminFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { response: string; note: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/feedback-requests", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setRows(data.requests || []);
      } else {
        setError(data.error || "피드백 요청 내역을 불러오지 못했습니다.");
      }
    } catch {
      setError("피드백 요청 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(
    id: string,
    status: (typeof STATUS_ORDER)[number],
    opts: { response?: string; note?: string } = {},
  ) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/feedback-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          adminResponse: opts.response,
          adminNote: opts.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "업데이트 실패");
      } else {
        await load();
      }
    } catch {
      setError("업데이트 실패");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>불러오는 중...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const submittedCount = rows.filter((r) => r.status === "submitted").length;
  const inProgressCount = rows.filter((r) => r.status === "in_progress").length;
  const answeredCount = rows.filter((r) => r.status === "answered").length;

  return (
    <div className="space-y-6">
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">에러</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>접수 대기</CardDescription>
            <CardTitle>{submittedCount}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>검토 중</CardDescription>
            <CardTitle>{inProgressCount}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>답변 완료</CardDescription>
            <CardTitle>{answeredCount}건</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>아직 제출된 피드백 요청이 없습니다.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const draft = drafts[row.id] || {
              response: row.admin_response || "",
              note: row.admin_note || "",
            };
            return (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{TYPE_LABELS[row.request_type] || row.request_type}</Badge>
                    <Badge>{STATUS_LABELS[row.status] || row.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(row.created_at)}
                    </span>
                    {row.reviews && (
                      <Badge variant="secondary">
                        피드백권 {row.reviews.feedback_tickets_remaining}/
                        {row.reviews.feedback_tickets_granted}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2">{row.title}</CardTitle>
                  <CardDescription>
                    {row.users?.email || row.user_id}
                    {row.reviews?.channel_name && ` · ${row.reviews.channel_name}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">요청 내용</div>
                    <div className="whitespace-pre-wrap text-sm">{row.description}</div>
                    {row.reference_url && (
                      <a
                        href={row.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                      >
                        참고 링크: {row.reference_url}
                      </a>
                    )}
                  </div>

                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      운영진 답변 (유저에게 노출)
                    </div>
                    <Textarea
                      rows={4}
                      placeholder="답변 내용 — 유저의 피드백 페이지에 그대로 표시됩니다."
                      value={draft.response}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, response: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      내부 메모 (유저 비공개)
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="운영진 내부용 메모"
                      value={draft.note}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, note: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={saving === row.id}
                      onClick={() =>
                        patch(row.id, "in_progress", {
                          response: draft.response,
                          note: draft.note,
                        })
                      }
                    >
                      검토 중으로 이동
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving === row.id}
                      onClick={() =>
                        patch(row.id, "answered", {
                          response: draft.response,
                          note: draft.note,
                        })
                      }
                    >
                      답변 완료 처리
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saving === row.id}
                      onClick={() =>
                        patch(row.id, "closed", { response: draft.response, note: draft.note })
                      }
                    >
                      종료
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saving === row.id}
                      onClick={() =>
                        patch(row.id, "rejected", { response: draft.response, note: draft.note })
                      }
                    >
                      반려
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
