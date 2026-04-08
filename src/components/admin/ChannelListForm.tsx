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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

// 월 옵션 (최근 12개월)
function getMonthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    opts.push({ value: val, label });
  }
  return opts;
}

// ── 수정 ──
export function EditChannelListButton({ channel }: { channel: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      id: channel.id,
      title: fd.get("title"),
      subscriber_count: parseInt(fd.get("subscriber_count") as string) || 0,
      avg_view_count: parseInt(fd.get("avg_view_count") as string) || 0,
      median_views: parseInt(fd.get("median_views") as string) || 0,
      category: fd.get("category") || "",
      subcategory: fd.get("subcategory") || "",
      format: fd.get("format") || "",
      channel_url: fd.get("channel_url") || "",
    };

    const res = await fetch("/api/admin/channel-list", {
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
          <div>
            <Label htmlFor="title">채널명</Label>
            <Input id="title" name="title" defaultValue={channel.title as string} required />
          </div>
          <div>
            <Label htmlFor="channel_url">채널 URL</Label>
            <Input id="channel_url" name="channel_url" defaultValue={(channel.channel_url as string) || ""} />
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subscriber_count">구독자</Label>
              <Input id="subscriber_count" name="subscriber_count" type="number" defaultValue={(channel.subscriber_count as number) || 0} />
            </div>
            <div>
              <Label htmlFor="avg_view_count">평균 조회수</Label>
              <Input id="avg_view_count" name="avg_view_count" type="number" defaultValue={(channel.avg_view_count as number) || 0} />
            </div>
            <div>
              <Label htmlFor="median_views">중위 조회수</Label>
              <Input id="median_views" name="median_views" type="number" defaultValue={(channel.median_views as number) || 0} />
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

// ── 삭제 ──
export function DeleteChannelListButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setLoading(true);

    const res = await fetch(`/api/admin/channel-list?id=${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}

// ── 일괄 업로드 ──
export function BulkUploadButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ success: number; fail: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const monthOptions = getMonthOptions();

  function parseRows(raw: string) {
    const lines = raw.trim().split("\n").filter(Boolean);
    if (!lines.length) return [];

    const sep = lines[0].includes("\t") ? "\t" : ",";
    const rows = lines.map((line) => line.split(sep).map((c) => c.trim()));

    const first = rows[0];
    if (first && isNaN(Number(first[1]?.replace(/,/g, "")))) {
      rows.shift();
    }
    return rows;
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const XLSX = (await import("xlsx")).default;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      setText(rows.map((r) => r.join("\t")).join("\n"));
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setText((ev.target?.result as string) || "");
      reader.readAsText(file);
    }
  }

  async function handleSubmit() {
    if (!month) return alert("월을 선택해주세요");
    const rows = parseRows(text);
    if (!rows.length) return alert("데이터가 없습니다");

    setLoading(true);
    setResult(null);
    let success = 0;
    let fail = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += 10) {
      const batch = rows.slice(i, i + 10);
      const promises = batch.map(async (cols) => {
        const [name, subs, avg, median, category, subcategory, format, channelUrl] = cols;
        if (!name) return;

        const handle = channelUrl?.match(/@([^/,]+)/)?.[1] || name.replace(/\s+/g, "_");
        const body = {
          id: `ch_${month}_${handle}`,
          month,
          title: name,
          subscriber_count: parseInt((subs || "0").replace(/,/g, "")) || 0,
          avg_view_count: parseInt((avg || "0").replace(/,/g, "")) || 0,
          median_views: parseInt((median || "0").replace(/,/g, "")) || 0,
          category: category || "",
          subcategory: subcategory || "",
          format: format || "",
          channel_url: channelUrl || "",
        };

        const res = await fetch("/api/admin/channel-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.ok) success++;
        else {
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
            <Label>월 선택 *</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="월을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>엑셀(.xlsx) / CSV 파일</Label>
            <Input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv,.txt"
              onChange={handleFile}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bulk_text">또는 직접 붙여넣기 (탭/쉼표 구분)</Label>
            <p className="text-xs text-muted-foreground mb-1">
              컬럼: 채널명, 구독자, 평균조회수, 중위조회수, 대분류, 소분류, 제작형식, 채널URL
            </p>
            <Textarea
              id="bulk_text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`제로비\t740000\t10469095\t9215350\t지식/정보\t정보 (원가 계산)\t촬영\thttps://...\n셀럽뿅감독\t66300\t4759535\t...`}
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

          <Button onClick={handleSubmit} disabled={loading || !text || !month} className="w-full">
            {loading ? "업로드 중..." : `${month || "월 선택 후"} 일괄 등록`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
