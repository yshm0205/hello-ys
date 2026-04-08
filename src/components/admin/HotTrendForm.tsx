"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddHotChannelButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      channel_id: formData.get("channel_id"),
      title: formData.get("title"),
      thumbnail_url: formData.get("thumbnail_url") || null,
      subscriber_count: parseInt(formData.get("subscriber_count") as string) || 0,
      video_count: parseInt(formData.get("video_count") as string) || 0,
      total_view_count: parseInt(formData.get("total_view_count") as string) || 0,
      avg_view_count: parseInt(formData.get("avg_view_count") as string) || 0,
      median_views: parseInt(formData.get("median_views") as string) || 0,
      category: formData.get("category") || "",
      subcategory: formData.get("subcategory") || "",
      format: formData.get("format") || "",
      channel_url: formData.get("channel_url") || "",
      month: formData.get("month") || "",
    };

    const res = await fetch("/api/admin/hot-trends", {
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
          <Plus className="h-4 w-4 mr-2" />
          채널 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>핫 채널 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="channel_id">채널 ID *</Label>
              <Input id="channel_id" name="channel_id" placeholder="UC..." required />
            </div>
            <div>
              <Label htmlFor="month">월 *</Label>
              <Input id="month" name="month" placeholder="2026-04" required />
            </div>
          </div>
          <div>
            <Label htmlFor="title">채널명 *</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="channel_url">채널 URL</Label>
            <Input id="channel_url" name="channel_url" placeholder="https://www.youtube.com/..." />
          </div>
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input id="thumbnail_url" name="thumbnail_url" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">대분류</Label>
              <Input id="category" name="category" placeholder="지식/정보" />
            </div>
            <div>
              <Label htmlFor="subcategory">소분류</Label>
              <Input id="subcategory" name="subcategory" placeholder="정보 (원가 계산)" />
            </div>
            <div>
              <Label htmlFor="format">제작형식</Label>
              <Input id="format" name="format" placeholder="촬영" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subscriber_count">구독자 수</Label>
              <Input id="subscriber_count" name="subscriber_count" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="video_count">영상 수</Label>
              <Input id="video_count" name="video_count" type="number" defaultValue="0" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="avg_view_count">평균 조회수</Label>
              <Input id="avg_view_count" name="avg_view_count" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="median_views">중위 조회수</Label>
              <Input id="median_views" name="median_views" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="total_view_count">총 조회수</Label>
              <Input id="total_view_count" name="total_view_count" type="number" defaultValue="0" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "추가 중..." : "추가"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditHotChannelButton({ channel }: { channel: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      channel_id: channel.channel_id,
      title: formData.get("title"),
      thumbnail_url: formData.get("thumbnail_url") || null,
      subscriber_count: parseInt(formData.get("subscriber_count") as string) || 0,
      video_count: parseInt(formData.get("video_count") as string) || 0,
      total_view_count: parseInt(formData.get("total_view_count") as string) || 0,
      avg_view_count: parseInt(formData.get("avg_view_count") as string) || 0,
      median_views: parseInt(formData.get("median_views") as string) || 0,
      category: formData.get("category") || "",
      subcategory: formData.get("subcategory") || "",
      format: formData.get("format") || "",
      channel_url: formData.get("channel_url") || "",
      month: formData.get("month") || "",
    };

    const res = await fetch("/api/admin/hot-trends", {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>채널 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>채널 ID</Label>
              <Input value={channel.channel_id as string} disabled />
            </div>
            <div>
              <Label htmlFor="month">월</Label>
              <Input id="month" name="month" defaultValue={(channel.month as string) || ""} placeholder="2026-04" />
            </div>
          </div>
          <div>
            <Label htmlFor="title">채널명</Label>
            <Input id="title" name="title" defaultValue={channel.title as string} required />
          </div>
          <div>
            <Label htmlFor="channel_url">채널 URL</Label>
            <Input id="channel_url" name="channel_url" defaultValue={(channel.channel_url as string) || ""} />
          </div>
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input id="thumbnail_url" name="thumbnail_url" defaultValue={(channel.thumbnail_url as string) || ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">대분류</Label>
              <Input id="category" name="category" defaultValue={(channel.category as string) || ""} />
            </div>
            <div>
              <Label htmlFor="subcategory">소분류</Label>
              <Input id="subcategory" name="subcategory" defaultValue={(channel.subcategory as string) || ""} />
            </div>
            <div>
              <Label htmlFor="format">제작형식</Label>
              <Input id="format" name="format" defaultValue={(channel.format as string) || ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subscriber_count">구독자 수</Label>
              <Input id="subscriber_count" name="subscriber_count" type="number" defaultValue={(channel.subscriber_count as number) || 0} />
            </div>
            <div>
              <Label htmlFor="video_count">영상 수</Label>
              <Input id="video_count" name="video_count" type="number" defaultValue={(channel.video_count as number) || 0} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="avg_view_count">평균 조회수</Label>
              <Input id="avg_view_count" name="avg_view_count" type="number" defaultValue={(channel.avg_view_count as number) || 0} />
            </div>
            <div>
              <Label htmlFor="median_views">중위 조회수</Label>
              <Input id="median_views" name="median_views" type="number" defaultValue={(channel.median_views as number) || 0} />
            </div>
            <div>
              <Label htmlFor="total_view_count">총 조회수</Label>
              <Input id="total_view_count" name="total_view_count" type="number" defaultValue={(channel.total_view_count as number) || 0} />
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

export function DeleteHotChannelButton({ channelId }: { channelId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);

    const res = await fetch(`/api/admin/hot-trends?id=${channelId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
