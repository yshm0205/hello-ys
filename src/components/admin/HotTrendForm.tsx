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

interface HotTrend {
  id: string;
  category: string;
  title: string;
  channel_name: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  view_count: number;
  is_active: boolean;
  sort_order: number;
}

export function AddHotTrendButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get("title"),
      category: formData.get("category") || "",
      channel_name: formData.get("channel_name") || null,
      video_url: formData.get("video_url") || null,
      thumbnail_url: formData.get("thumbnail_url") || null,
      view_count: parseInt(formData.get("view_count") as string) || 0,
      is_active: formData.get("is_active") === "true",
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
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
          항목 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>HOT 트렌드 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <Input id="category" name="category" placeholder="예: 건강, IT, 재테크..." required />
            </div>
            <div>
              <Label htmlFor="channel_name">채널명</Label>
              <Input id="channel_name" name="channel_name" />
            </div>
          </div>
          <div>
            <Label htmlFor="video_url">영상 URL</Label>
            <Input id="video_url" name="video_url" placeholder="https://youtube.com/..." />
          </div>
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input id="thumbnail_url" name="thumbnail_url" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="view_count">조회수</Label>
              <Input id="view_count" name="view_count" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="sort_order">순서</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="is_active">상태</Label>
              <select name="is_active" defaultValue="true"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
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

export function EditHotTrendButton({ trend }: { trend: HotTrend }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      id: trend.id,
      title: formData.get("title"),
      category: formData.get("category") || "",
      channel_name: formData.get("channel_name") || null,
      video_url: formData.get("video_url") || null,
      thumbnail_url: formData.get("thumbnail_url") || null,
      view_count: parseInt(formData.get("view_count") as string) || 0,
      is_active: formData.get("is_active") === "true",
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>항목 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" defaultValue={trend.title} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">카테고리</Label>
              <Input id="category" name="category" defaultValue={trend.category || ""} />
            </div>
            <div>
              <Label htmlFor="channel_name">채널명</Label>
              <Input id="channel_name" name="channel_name" defaultValue={trend.channel_name || ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="video_url">영상 URL</Label>
            <Input id="video_url" name="video_url" defaultValue={trend.video_url || ""} />
          </div>
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input id="thumbnail_url" name="thumbnail_url" defaultValue={trend.thumbnail_url || ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="view_count">조회수</Label>
              <Input id="view_count" name="view_count" type="number" defaultValue={trend.view_count} />
            </div>
            <div>
              <Label htmlFor="sort_order">순서</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue={trend.sort_order} />
            </div>
            <div>
              <Label htmlFor="is_active">상태</Label>
              <select name="is_active" defaultValue={String(trend.is_active)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
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

export function DeleteHotTrendButton({ trendId }: { trendId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);

    const res = await fetch(`/api/admin/hot-trends?id=${trendId}`, {
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
