"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface HotListDailyEntry {
  id: string;
  date: string;
  video_id: string;
  rank: number | null;
  view_count: number;
  subscriber_count: number;
  avg_channel_views: number;
  contribution_rate: number;
  performance_rate: number;
  view_velocity: number;
  engagement_rate: number;
  score: number;
  reason_flags: string[] | null;
}

function toReasonFlags(rawValue: FormDataEntryValue | null) {
  return String(rawValue || "")
    .split(",")
    .map((flag) => flag.trim())
    .filter(Boolean);
}

function getDefaultReasonFlags(entry?: HotListDailyEntry) {
  if (!entry?.reason_flags?.length) {
    return "";
  }

  return entry.reason_flags.join(", ");
}

export function AddHotListDailyButton({
  defaultDate,
}: {
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      date: formData.get("date"),
      video_id: formData.get("video_id"),
      rank: parseInt(String(formData.get("rank") || "0"), 10) || 0,
      view_count: parseInt(String(formData.get("view_count") || "0"), 10) || 0,
      subscriber_count:
        parseInt(String(formData.get("subscriber_count") || "0"), 10) || 0,
      avg_channel_views:
        parseInt(String(formData.get("avg_channel_views") || "0"), 10) || 0,
      contribution_rate:
        parseFloat(String(formData.get("contribution_rate") || "0")) || 0,
      performance_rate:
        parseFloat(String(formData.get("performance_rate") || "0")) || 0,
      view_velocity:
        parseFloat(String(formData.get("view_velocity") || "0")) || 0,
      engagement_rate:
        parseFloat(String(formData.get("engagement_rate") || "0")) || 0,
      score: parseFloat(String(formData.get("score") || "0")) || 0,
      reason_flags: toReasonFlags(formData.get("reason_flags")),
    };

    const res = await fetch("/api/admin/hot-list-daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          일별 랭킹 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>일별 HOT 랭킹 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="video_id">Video ID</Label>
              <Input id="video_id" name="video_id" placeholder="youtube-video-id" required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricField label="순위" name="rank" defaultValue="1" />
            <MetricField label="조회수" name="view_count" defaultValue="0" />
            <MetricField label="구독자 수" name="subscriber_count" defaultValue="0" />
            <MetricField label="채널 평균 조회수" name="avg_channel_views" defaultValue="0" />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricField label="기여도" name="contribution_rate" defaultValue="0" step="0.1" />
            <MetricField label="성과율" name="performance_rate" defaultValue="0" step="0.1" />
            <MetricField label="속도" name="view_velocity" defaultValue="0" step="0.1" />
            <MetricField label="점수" name="score" defaultValue="0" step="0.1" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricField label="참여율" name="engagement_rate" defaultValue="0" step="0.1" />
            <div className="space-y-2">
              <Label htmlFor="reason_flags">reason_flags</Label>
              <Textarea
                id="reason_flags"
                name="reason_flags"
                placeholder="예: high_velocity, underpriced_channel"
                className="min-h-[84px]"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "저장 중..." : "저장"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditHotListDailyButton({
  entry,
}: {
  entry: HotListDailyEntry;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const defaultReasonFlags = useMemo(() => getDefaultReasonFlags(entry), [entry]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      id: entry.id,
      date: formData.get("date"),
      video_id: formData.get("video_id"),
      rank: parseInt(String(formData.get("rank") || "0"), 10) || 0,
      view_count: parseInt(String(formData.get("view_count") || "0"), 10) || 0,
      subscriber_count:
        parseInt(String(formData.get("subscriber_count") || "0"), 10) || 0,
      avg_channel_views:
        parseInt(String(formData.get("avg_channel_views") || "0"), 10) || 0,
      contribution_rate:
        parseFloat(String(formData.get("contribution_rate") || "0")) || 0,
      performance_rate:
        parseFloat(String(formData.get("performance_rate") || "0")) || 0,
      view_velocity:
        parseFloat(String(formData.get("view_velocity") || "0")) || 0,
      engagement_rate:
        parseFloat(String(formData.get("engagement_rate") || "0")) || 0,
      score: parseFloat(String(formData.get("score") || "0")) || 0,
      reason_flags: toReasonFlags(formData.get("reason_flags")),
    };

    const res = await fetch("/api/admin/hot-list-daily", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>일별 HOT 랭킹 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input id="date" name="date" type="date" defaultValue={entry.date} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="video_id">Video ID</Label>
              <Input id="video_id" name="video_id" defaultValue={entry.video_id} required />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricField label="순위" name="rank" defaultValue={String(entry.rank || 0)} />
            <MetricField label="조회수" name="view_count" defaultValue={String(entry.view_count || 0)} />
            <MetricField label="구독자 수" name="subscriber_count" defaultValue={String(entry.subscriber_count || 0)} />
            <MetricField label="채널 평균 조회수" name="avg_channel_views" defaultValue={String(entry.avg_channel_views || 0)} />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <MetricField label="기여도" name="contribution_rate" defaultValue={String(entry.contribution_rate || 0)} step="0.1" />
            <MetricField label="성과율" name="performance_rate" defaultValue={String(entry.performance_rate || 0)} step="0.1" />
            <MetricField label="속도" name="view_velocity" defaultValue={String(entry.view_velocity || 0)} step="0.1" />
            <MetricField label="점수" name="score" defaultValue={String(entry.score || 0)} step="0.1" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MetricField label="참여율" name="engagement_rate" defaultValue={String(entry.engagement_rate || 0)} step="0.1" />
            <div className="space-y-2">
              <Label htmlFor="reason_flags">reason_flags</Label>
              <Textarea
                id="reason_flags"
                name="reason_flags"
                defaultValue={defaultReasonFlags}
                className="min-h-[84px]"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "저장 중..." : "수정 저장"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteHotListDailyButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 일별 HOT 랭킹 항목을 삭제할까요?")) return;

    setLoading(true);
    const res = await fetch(`/api/admin/hot-list-daily?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
    </Button>
  );
}

function MetricField({
  label,
  name,
  defaultValue,
  step,
}: {
  label: string;
  name: string;
  defaultValue: string;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" defaultValue={defaultValue} step={step} />
    </div>
  );
}
