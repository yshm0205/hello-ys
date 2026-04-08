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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  order_index: number;
}

export function AddLectureButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      title: formData.get("title"),
      description: formData.get("description") || null,
      video_url: formData.get("video_url") || null,
      thumbnail_url: formData.get("thumbnail_url") || null,
      status: formData.get("status") || "draft",
      order_index: parseInt(formData.get("order_index") as string) || 0,
    };

    const res = await fetch("/api/admin/lectures", {
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
          강의 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 강의 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="description">설명</Label>
            <Input id="description" name="description" />
          </div>
          <div>
            <Label htmlFor="video_url">영상 URL (VdoCipher 등)</Label>
            <Input id="video_url" name="video_url" placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input id="thumbnail_url" name="thumbnail_url" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">상태</Label>
              <Select name="status" defaultValue="draft">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="published">공개</SelectItem>
                  <SelectItem value="hidden">숨김</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order_index">순서</Label>
              <Input id="order_index" name="order_index" type="number" defaultValue="0" />
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

export function EditLectureButton({ lecture }: { lecture: Lecture }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      id: lecture.id,
      title: formData.get("title"),
      description: formData.get("description") || null,
      video_url: formData.get("video_url") || null,
      thumbnail_url: formData.get("thumbnail_url") || null,
      status: formData.get("status"),
      order_index: parseInt(formData.get("order_index") as string) || 0,
    };

    const res = await fetch("/api/admin/lectures", {
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
          <DialogTitle>강의 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" defaultValue={lecture.title} required />
          </div>
          <div>
            <Label htmlFor="description">설명</Label>
            <Input id="description" name="description" defaultValue={lecture.description || ""} />
          </div>
          <div>
            <Label htmlFor="video_url">영상 URL</Label>
            <Input id="video_url" name="video_url" defaultValue={lecture.video_url || ""} />
          </div>
          <div>
            <Label htmlFor="thumbnail_url">썸네일 URL</Label>
            <Input id="thumbnail_url" name="thumbnail_url" defaultValue={lecture.thumbnail_url || ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">상태</Label>
              <Select name="status" defaultValue={lecture.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="published">공개</SelectItem>
                  <SelectItem value="hidden">숨김</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="order_index">순서</Label>
              <Input id="order_index" name="order_index" type="number" defaultValue={lecture.order_index} />
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

export function DeleteLectureButton({ lectureId }: { lectureId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);

    const res = await fetch(`/api/admin/lectures?id=${lectureId}`, {
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
