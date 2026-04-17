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

interface Material {
  id: string;
  vod_id: string;
  title: string;
  type: string;
  url: string;
  file_size: string | null;
  sort_order: number;
}

interface AddMaterialButtonProps {
  defaultVodId?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "secondary";
}

export function AddMaterialButton({
  defaultVodId,
  triggerLabel = "자료 추가",
  triggerVariant = "outline",
}: AddMaterialButtonProps = {}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      vod_id: formData.get("vod_id"),
      title: formData.get("title"),
      type: formData.get("type"),
      url: formData.get("url"),
      file_size: formData.get("file_size") || null,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    };

    const res = await fetch("/api/admin/materials", {
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
        <Button variant={triggerVariant} size="sm" aria-label={triggerLabel}>
          <Plus className="h-4 w-4 mr-2" />
          자료 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>강의 자료 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vod_id">VOD ID *</Label>
              <Input
                id="vod_id"
                name="vod_id"
                placeholder="vod_01"
                defaultValue={defaultVodId || ""}
                readOnly={!!defaultVodId}
                required
                className={defaultVodId ? "bg-muted" : undefined}
              />
            </div>
            <div>
              <Label htmlFor="type">타입 *</Label>
              <select
                name="type"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="docs">문서</option>
                <option value="image">이미지</option>
                <option value="audio">오디오</option>
                <option value="folder">폴더</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="url">URL *</Label>
            <Input id="url" name="url" placeholder="https://..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="file_size">파일 크기</Label>
              <Input id="file_size" name="file_size" placeholder="2.1MB" />
            </div>
            <div>
              <Label htmlFor="sort_order">순서</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue="0" />
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

export function EditMaterialButton({ material }: { material: Material }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      id: material.id,
      vod_id: formData.get("vod_id"),
      title: formData.get("title"),
      type: formData.get("type"),
      url: formData.get("url"),
      file_size: formData.get("file_size") || null,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    };

    const res = await fetch("/api/admin/materials", {
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
          <DialogTitle>자료 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vod_id">VOD ID</Label>
              <Input id="vod_id" name="vod_id" defaultValue={material.vod_id} required />
            </div>
            <div>
              <Label htmlFor="type">타입</Label>
              <select
                name="type"
                defaultValue={material.type}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="docs">문서</option>
                <option value="image">이미지</option>
                <option value="audio">오디오</option>
                <option value="folder">폴더</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="title">제목</Label>
            <Input id="title" name="title" defaultValue={material.title} required />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" defaultValue={material.url} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="file_size">파일 크기</Label>
              <Input id="file_size" name="file_size" defaultValue={material.file_size || ""} />
            </div>
            <div>
              <Label htmlFor="sort_order">순서</Label>
              <Input id="sort_order" name="sort_order" type="number" defaultValue={material.sort_order} />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "수정 중..." : "수정"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteMaterialButton({ materialId }: { materialId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);

    const res = await fetch(`/api/admin/materials?id=${materialId}`, { method: "DELETE" });

    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
