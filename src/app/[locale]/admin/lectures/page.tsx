import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
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
import { GraduationCap } from "lucide-react";
import {
  AddLectureButton,
  EditLectureButton,
  DeleteLectureButton,
} from "@/components/admin/LectureForm";

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: string;
  order_index: number;
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
  const pageSize = filters?.pageSize || 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("lectures")
      .select("*", { count: "exact" })
      .order("order_index", { ascending: true });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.q) {
      query = query.ilike("title", `%${filters.q}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      return { data: [], totalPages: 0, tableExists: false };
    }

    return {
      data: (data as Lecture[]) || [],
      totalPages: Math.ceil((count || 0) / pageSize),
      tableExists: true,
    };
  } catch {
    return { data: [], totalPages: 0, tableExists: false };
  }
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

  const statusLabels: Record<string, string> = {
    published: "공개",
    draft: "초안",
    hidden: "숨김",
  };

  const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
    published: "default",
    draft: "secondary",
    hidden: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {lectures.tableExists && <AddLectureButton />}
      </div>

      {!lectures.tableExists && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  lectures 테이블이 없습니다
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Supabase에서 아래 SQL을 실행해주세요.
                </p>
                <pre className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-md text-xs text-left overflow-x-auto max-w-lg mx-auto">
{`CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'draft',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {lectures.tableExists && (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <AdminSearch placeholder="강의 제목 검색..." />
            <AdminFilter
              name="status"
              placeholder="전체 상태"
              options={[
                { label: "공개", value: "published" },
                { label: "초안", value: "draft" },
                { label: "숨김", value: "hidden" },
              ]}
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">순서</TableHead>
                  <TableHead>{t("lectureTitle")}</TableHead>
                  <TableHead>영상</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                  <TableHead className="w-[100px]">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lectures.data.map((lecture) => (
                  <TableRow key={lecture.id}>
                    <TableCell className="text-center text-muted-foreground">
                      {lecture.order_index}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{lecture.title}</div>
                      {lecture.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {lecture.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {lecture.video_url ? (
                        <Badge variant="default">있음</Badge>
                      ) : (
                        <Badge variant="secondary">없음</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[lecture.status] || "secondary"}>
                        {statusLabels[lecture.status] || lecture.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(lecture.created_at).toLocaleDateString("ko-KR")}
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
                    <TableCell colSpan={6} className="h-24 text-center">
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
        </>
      )}
    </div>
  );
}
