"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type EnrollmentRow = {
  id: string;
  user_id: string;
  email: string;
  cohort: string;
  status: string;
  access_starts_at: string;
  access_ends_at: string | null;
  bonus_credits_granted: number;
  discount_status: string;
  discount_amount: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type SubmissionRow = {
  id: string;
  enrollment_id: string;
  user_id: string;
  email: string;
  cohort: string;
  day: number;
  title: string;
  content: string;
  reference_url: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: "참여중",
  paused: "중지",
  completed: "완료",
  removed: "제외",
};

const DISCOUNT_STATUS_LABELS: Record<string, string> = {
  none: "미정",
  candidate: "후보",
  granted: "지급",
  not_eligible: "제외",
};

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  submitted: "제출",
  reviewed: "확인",
  approved: "인정",
  needs_revision: "보완",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getBoardLabel(day: number) {
  if (day === 4) return "수강후기";
  if (day === 5) return "질문";
  return `${day}차 인증`;
}

export function ChallengeAdminClient() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [cohort, setCohort] = useState("2기");
  const [adminNote, setAdminNote] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState<Record<string, string>>({});

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/admin/challenge", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "챌린지 데이터를 불러오지 못했습니다.");
        return;
      }

      setEnrollments(data.enrollments || []);
      setSubmissions(data.submissions || []);
      const notes: Record<string, string> = {};
      (data.submissions || []).forEach((row: SubmissionRow) => {
        notes[row.id] = row.admin_note || "";
      });
      setSubmissionNotes(notes);
    } catch {
      setError("챌린지 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const active = enrollments.filter((row) => row.status === "active").length;
    const submitted = submissions.filter((row) => row.status === "submitted").length;
    const approved = submissions.filter((row) => row.status === "approved").length;
    return { active, submitted, approved };
  }, [enrollments, submissions]);

  async function enroll() {
    setError(null);
    setSaving("enroll");
    try {
      const res = await fetch("/api/admin/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cohort,
          adminNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "참여자 등록에 실패했습니다.");
        return;
      }

      setEmail("");
      setAdminNote("");
      await load();
    } catch {
      setError("참여자 등록에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  }

  async function patchEnrollment(
    id: string,
    patch: {
      status?: string;
      discountStatus?: string;
      discountAmount?: number;
      adminNote?: string;
    },
  ) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/challenge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "enrollment", id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "참여자 업데이트에 실패했습니다.");
      } else {
        await load();
      }
    } catch {
      setError("참여자 업데이트에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  }

  async function patchSubmission(id: string, status: string) {
    setSaving(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/challenge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "submission",
          id,
          status,
          adminNote: submissionNotes[id] || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "제출물 업데이트에 실패했습니다.");
      } else {
        await load();
      }
    } catch {
      setError("제출물 업데이트에 실패했습니다.");
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

  return (
    <div className="space-y-6">
      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">오류</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>참여중</CardDescription>
            <CardTitle>{stats.active}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>확인 대기 제출</CardDescription>
            <CardTitle>{stats.submitted}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>완료 인정</CardDescription>
            <CardTitle>{stats.approved}건</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>참여자 등록</CardTitle>
          <CardDescription>
            FlowSpot에 가입된 이메일만 등록됩니다. 크레딧은 2차 인증을 인정하면 30cr 자동 지급됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.6fr_0.7fr_0.9fr_2fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="challenge-email">이메일</Label>
            <Input
              id="challenge-email"
              placeholder="user@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenge-cohort">기수</Label>
            <Input
              id="challenge-cohort"
              value={cohort}
              onChange={(event) => setCohort(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenge-credits">2차 승인 지급</Label>
            <Input
              id="challenge-credits"
              type="number"
              min={0}
              max={100}
              value="30"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenge-note">운영 메모</Label>
            <Input
              id="challenge-note"
              placeholder="선발 사유, 공지방 닉네임 등"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
            />
          </div>
          <Button onClick={enroll} disabled={saving === "enroll"}>
            {saving === "enroll" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            등록
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>미션 제출 내역</CardTitle>
            <CardDescription>최근 제출순으로 표시됩니다.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 제출된 미션이 없습니다.</p>
          ) : (
            submissions.map((row) => {
              const isSaving = saving === row.id;
              return (
                <div key={row.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{row.cohort}</Badge>
                    <Badge>{getBoardLabel(row.day)}</Badge>
                    <Badge variant="secondary">
                      {SUBMISSION_STATUS_LABELS[row.status] || row.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(row.updated_at)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="font-semibold">{row.title}</p>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{row.content}</p>
                  {row.reference_url && (
                    <a
                      className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                      href={row.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      참고 링크: {row.reference_url}
                    </a>
                  )}
                  <div className="mt-4 space-y-2">
                    <Label htmlFor={`submission-note-${row.id}`}>운영자 메모</Label>
                    <Textarea
                      id={`submission-note-${row.id}`}
                      rows={2}
                      value={submissionNotes[row.id] || ""}
                      onChange={(event) =>
                        setSubmissionNotes((prev) => ({ ...prev, [row.id]: event.target.value }))
                      }
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => patchSubmission(row.id, "reviewed")}
                    >
                      확인
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSaving}
                      onClick={() => patchSubmission(row.id, "approved")}
                    >
                      인정
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isSaving}
                      onClick={() => patchSubmission(row.id, "needs_revision")}
                    >
                      보완
                    </Button>
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>참여자</CardTitle>
          <CardDescription>권한 상태와 할인권 후보 여부를 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 참여자가 없습니다.</p>
          ) : (
            enrollments.map((row) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1.6fr_0.8fr_0.9fr_0.8fr_auto]"
              >
                <div>
                  <p className="font-semibold">{row.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.cohort} · {formatDate(row.created_at)} · {row.bonus_credits_granted}cr 지급
                  </p>
                  {row.admin_note && (
                    <p className="mt-1 text-xs text-muted-foreground">{row.admin_note}</p>
                  )}
                </div>
                <Select
                  value={row.status}
                  onValueChange={(value) => patchEnrollment(row.id, { status: value })}
                  disabled={saving === row.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={row.discount_status}
                  onValueChange={(value) =>
                    patchEnrollment(row.id, {
                      discountStatus: value,
                      discountAmount: value === "granted" || value === "candidate" ? 20000 : 0,
                    })
                  }
                  disabled={saving === row.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DISCOUNT_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant={row.discount_status === "granted" ? "default" : "secondary"}>
                  {row.discount_amount.toLocaleString("ko-KR")}원
                </Badge>
                {saving === row.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
