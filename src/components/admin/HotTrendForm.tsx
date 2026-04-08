"use client";

import { useState, useRef } from "react";
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
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
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

/**
 * 일괄 업로드 — 엑셀 붙여넣기 또는 CSV/TSV 파일
 *
 * 컬럼 순서: 채널명 \t 구독자 \t 평균조회수 \t 중위조회수 \t 대분류 \t 소분류 \t 제작형식 \t 채널URL
 * 첫 줄이 헤더면 자동 스킵
 */
export function BulkUploadButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ success: number; fail: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function parseRows(raw: string) {
    const lines = raw.trim().split("\n").filter(Boolean);
    if (!lines.length) return [];

    // 탭 또는 쉼표 구분 자동 감지
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const rows = lines.map((line) => line.split(sep).map((c) => c.trim()));

    // 첫 줄이 헤더인지 판단 (숫자가 아닌 값이 2번째 컬럼에 있으면 헤더)
    const first = rows[0];
    if (first && isNaN(Number(first[1]?.replace(/,/g, "")))) {
      rows.shift();
    }

    return rows;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText((ev.target?.result as string) || "");
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (!month) return alert("월을 입력해주세요 (예: 2026-04)");
    const rows = parseRows(text);
    if (!rows.length) return alert("데이터가 없습니다");

    setLoading(true);
    setResult(null);
    let success = 0;
    let fail = 0;
    const errors: string[] = [];

    // 10개씩 batch
    for (let i = 0; i < rows.length; i += 10) {
      const batch = rows.slice(i, i + 10);
      const promises = batch.map(async (cols) => {
        const [name, subs, avg, median, category, subcategory, format, channelUrl] = cols;
        if (!name) return;

        const handle = channelUrl?.match(/@([^/,]+)/)?.[1] || name.replace(/\s+/g, "_");
        const body = {
          channel_id: `ch_${month}_${handle}`,
          title: name,
          subscriber_count: parseInt((subs || "0").replace(/,/g, "")) || 0,
          avg_view_count: parseInt((avg || "0").replace(/,/g, "")) || 0,
          median_views: parseInt((median || "0").replace(/,/g, "")) || 0,
          category: category || "",
          subcategory: subcategory || "",
          format: format || "",
          channel_url: channelUrl || "",
          month,
        };

        const res = await fetch("/api/admin/hot-trends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          success++;
        } else {
          fail++;
          errors.push(`${name}: ${(await res.json()).error || "실패"}`);
        }
      });
      await Promise.all(promises);
    }

    setResult({ success, fail, errors });
    setLoading(false);
    if (success > 0) router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          일괄 업로드
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>채널 일괄 업로드</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk_month">월 *</Label>
            <Input
              id="bulk_month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="2026-04"
            />
          </div>

          <div>
            <Label>엑셀/CSV 파일 선택</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFile}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bulk_text">
              또는 직접 붙여넣기 (탭/쉼표 구분)
            </Label>
            <p className="text-xs text-muted-foreground mb-1">
              컬럼: 채널명, 구독자, 평균조회수, 중위조회수, 대분류, 소분류, 제작형식, 채널URL
            </p>
            <Textarea
              id="bulk_text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`제로비\t740000\t10469095\t9215350\t지식/정보\t정보 (원가 계산)\t촬영\thttps://www.youtube.com/@제로비ZeroB/shorts\n셀럽뿅감독\t66300\t4759535\t3342953\t연예/팬덤\t그룹별 팬채널\t짜집기 편집\thttps://...`}
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          {text && (
            <p className="text-sm text-muted-foreground">
              {parseRows(text).length}개 행 감지됨
            </p>
          )}

          {result && (
            <div className={`rounded-md p-3 text-sm ${result.fail ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
              <p>성공: {result.success}개 / 실패: {result.fail}개</p>
              {result.errors.length > 0 && (
                <ul className="mt-1 text-xs text-red-600 list-disc pl-4">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {result.errors.length > 5 && <li>...외 {result.errors.length - 5}개</li>}
                </ul>
              )}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !text} className="w-full">
            {loading ? "업로드 중..." : "일괄 등록"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
