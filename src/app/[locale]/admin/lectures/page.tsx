import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AddMaterialButton,
  EditMaterialButton,
  DeleteMaterialButton,
} from "@/components/admin/MaterialForm";

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

interface Material {
  id: string;
  vod_id: string;
  title: string;
  type: string;
  url: string;
  file_size: string | null;
  sort_order: number;
  created_at: string;
}

async function getLectures(filters?: {
  q?: string;
  status?: string;
  page?: number;
}) {
  const supabase = createAdminClient();
  const page = filters?.page || 1;
  const pageSize = 20;
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

  const { data, count } = await query.range(from, to);

  return {
    data: (data as Lecture[]) || [],
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

async function getMaterials() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("lecture_materials")
    .select("*")
    .order("vod_id", { ascending: true })
    .order("sort_order", { ascending: true });

  return (data as Material[]) || [];
}

export default async function AdminLecturesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q, status, page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const t = await getTranslations("Admin.lectures");

  const [lectures, materials] = await Promise.all([
    getLectures({ q, status, page: currentPage }),
    getMaterials(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <AddLectureButton />
      </div>

      {/* 강의 목록 */}
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
      <AdminPagination currentPage={currentPage} totalPages={lectures.totalPages} />

      {/* 강의 자료 관리 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>강의 자료 ({materials.length}개)</CardTitle>
          <AddMaterialButton />
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VOD</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead>타입</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="w-[80px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-sm">{m.vod_id}</TableCell>
                    <TableCell className="text-sm">{m.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.file_size || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {m.url.slice(0, 40)}...
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditMaterialButton material={m} />
                        <DeleteMaterialButton materialId={m.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!materials.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-16 text-center">
                      자료가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
