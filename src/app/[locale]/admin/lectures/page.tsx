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
import { GraduationCap } from "lucide-react";

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

  // Check if lectures table exists by attempting query
  try {
    let query = supabase
      .from("lectures")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters?.q) {
      query = query.ilike("title", `%${filters.q}%`);
    }

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error("Lectures table may not exist:", error.message);
      return { data: [], totalPages: 0, tableExists: false };
    }

    return {
      data: data || [],
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

  const statusColors: Record<string, "default" | "secondary" | "destructive"> =
    {
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
      </div>

      {!lectures.tableExists && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">
                  Lectures table not found
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create the <code>lectures</code> table in Supabase to enable
                  lecture management. See{" "}
                  <code>docs/admin-dashboard-plan.md</code> for the schema.
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
            <AdminSearch placeholder="Search lecture title..." />
            <AdminFilter
              name="status"
              placeholder="All Statuses"
              options={[
                { label: t("published"), value: "published" },
                { label: t("draft"), value: "draft" },
                { label: t("hidden"), value: "hidden" },
              ]}
            />
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("lectureTitle")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("createdAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lectures.data.map(
                  (lecture: {
                    id: string;
                    title: string;
                    status: string;
                    created_at: string;
                  }) => (
                    <TableRow key={lecture.id}>
                      <TableCell className="font-medium">
                        {lecture.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusColors[lecture.status] || "secondary"}
                        >
                          {t(lecture.status as "published" | "draft" | "hidden")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(lecture.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                )}
                {!lectures.data.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
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
