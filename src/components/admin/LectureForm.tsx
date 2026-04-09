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

interface Lecture {
  id: string;
  part_number: number;
  part_title: string;
  vod_number: number;
  vod_title: string;
  duration_minutes: number;
  video_url: string | null;
  is_published: boolean;
  sort_order: number;
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
      part_number: parseInt(formData.get("part_number") as string) || 1,
      part_title: formData.get("part_title") || "",
      vod_number: parseInt(formData.get("vod_number") as string) || 1,
      vod_title: formData.get("vod_title") || "",
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || 0,
      video_url: formData.get("video_url") || null,
      is_published: formData.get("is_published") === "true",
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="part_number">파트 번호</Label>
              <Input id="part_number" name="part_number" type="number" defaultValue="1" required />
            </div>
            <div>
              <Label htmlFor="part_title">파트 제목</Label>
              <Input id="part_title" name="part_title" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vod_number">VOD 번호</Label>
              <Input id="vod_number" name="vod_number" type="number" defaultValue="1" required />
            </div>
            <div>
              <Label htmlFor="vod_title">VOD 제목 *</Label>
              <Input id="vod_title" name="vod_title" required />
            </div>
          </div>
          <div>
            <Label htmlFor="video_url">영상 URL (VdoCipher 등)</Label>
            <Input id="video_url" name="video_url" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duration_minutes">길이(분)</Label>
              <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="sort_order">순서</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
            </div>
            <div>
              <Label htmlFor="is_published">공개 여부</Label>
              <select name="is_published" defaultValue="false"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="false">비공개</option>
                <option value="true">공개</option>
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
      part_number: parseInt(formData.get("part_number") as string) || 1,
      part_title: formData.get("part_title") || "",
      vod_number: parseInt(formData.get("vod_number") as string) || 1,
      vod_title: formData.get("vod_title") || "",
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || 0,
      video_url: formData.get("video_url") || null,
      is_published: formData.get("is_published") === "true",
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="part_number">파트 번호</Label>
              <Input id="part_number" name="part_number" type="number" defaultValue={lecture.part_number} required />
            </div>
            <div>
              <Label htmlFor="part_title">파트 제목</Label>
              <Input id="part_title" name="part_title" defaultValue={lecture.part_title} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vod_number">VOD 번호</Label>
              <Input id="vod_number" name="vod_number" type="number" defaultValue={lecture.vod_number} required />
            </div>
            <div>
              <Label htmlFor="vod_title">VOD 제목 *</Label>
              <Input id="vod_title" name="vod_title" defaultValue={lecture.vod_title} required />
            </div>
          </div>
          <div>
            <Label htmlFor="video_url">영상 URL</Label>
            <Input id="video_url" name="video_url" defaultValue={lecture.video_url || ""} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duration_minutes">길이(분)</Label>
              <Input id="duration_minutes" name="duration_minutes" type="number" defaultValue={lecture.duration_minutes} />
            </div>
            <div>
              <Label htmlFor="sort_order">순서</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue={lecture.sort_order} />
            </div>
            <div>
              <Label htmlFor="is_published">공개 여부</Label>
              <select name="is_published" defaultValue={String(lecture.is_published)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="false">비공개</option>
                <option value="true">공개</option>
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
