import { createAdminClient } from "@/utils/supabase/admin";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminFilter } from "@/components/admin/AdminFilter";
import {
  AddLectureButton,
  EditLectureButton,
  DeleteLectureButton,
} from "@/components/admin/LectureForm";

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
  created_at: string;
}

async function getLectures(filters?: {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("lectures")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true });

  if (filters?.status === "published") {
    query = query.eq("is_published", true);
  } else if (filters?.status === "draft") {
    query = query.eq("is_published", false);
  }

  if (filters?.q) {
    query = query.or(`vod_title.ilike.%${filters.q}%,part_title.ilike.%${filters.q}%`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error("Lectures query error:", error.message);
  }

  return {
    data: (data as Lecture[]) || [],
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export default async function AdminLecturesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const t = await getTranslations("Admin.lectures");

  const lectures = await getLectures({ q, status, page: currentPage });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <AddLectureButton />
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <AdminSearch placeholder="강의 제목 검색..." />
        <AdminFilter
          name="status"
          placeholder="전체 상태"
          options={[
            { label: "공개", value: "published" },
            { label: "비공개", value: "draft" },
          ]}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead className="w-[80px]">파트</TableHead>
              <TableHead>VOD 제목</TableHead>
              <TableHead className="w-[80px]">시간</TableHead>
              <TableHead>영상</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-[100px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lectures.data.map((lecture) => (
              <TableRow key={lecture.id}>
                <TableCell className="text-center text-muted-foreground">
                  {lecture.sort_order}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">Part {lecture.part_number}</div>
                  <div className="text-xs text-muted-foreground">{lecture.part_title}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">VOD {lecture.vod_number}. {lecture.vod_title}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {lecture.duration_minutes}분
                </TableCell>
                <TableCell>
                  {lecture.video_url ? (
                    <Badge variant="default">있음</Badge>
                  ) : (
                    <Badge variant="secondary">없음</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={lecture.is_published ? "default" : "secondary"}>
                    {lecture.is_published ? "공개" : "비공개"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <EditLectureButton lecture={lecture} />
                    <DeleteLectureButton lectureId={lecture.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!lectures.data.length && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {t("noLectures")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        currentPage={currentPage}
        totalPages={lectures.totalPages}
      />
    </div>
  );
}
