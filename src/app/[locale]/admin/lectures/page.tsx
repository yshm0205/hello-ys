import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
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
import { FileText, Image as ImageIcon, Music, FolderOpen, Video, Clock } from "lucide-react";

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

interface Material {
  id: string;
  vod_id: string;
  title: string;
  type: string;
  url: string;
  file_size: string | null;
  sort_order: number;
}

const typeIcons: Record<string, React.ReactNode> = {
  docs: <FileText className="h-4 w-4 text-blue-500" />,
  image: <ImageIcon className="h-4 w-4 text-green-500" />,
  audio: <Music className="h-4 w-4 text-purple-500" />,
  folder: <FolderOpen className="h-4 w-4 text-yellow-500" />,
};

const typeLabels: Record<string, string> = {
  docs: "문서",
  image: "이미지",
  audio: "오디오",
  folder: "폴더",
};

async function getLectures() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("lectures")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as Lecture[]) || [];
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

export default async function AdminLecturesPage() {
  const t = await getTranslations("Admin.lectures");

  const [lectures, materials] = await Promise.all([
    getLectures(),
    getMaterials(),
  ]);

  // VOD별 자료 맵
  const materialsByVod = new Map<string, Material[]>();
  for (const m of materials) {
    const list = materialsByVod.get(m.vod_id) || [];
    list.push(m);
    materialsByVod.set(m.vod_id, list);
  }

  // Part별 그룹핑
  const partGroups = new Map<number, { title: string; lectures: Lecture[] }>();
  for (const lec of lectures) {
    if (!partGroups.has(lec.part_number)) {
      partGroups.set(lec.part_number, { title: lec.part_title, lectures: [] });
    }
    partGroups.get(lec.part_number)!.lectures.push(lec);
  }

  const totalDuration = lectures.reduce((sum, l) => sum + l.duration_minutes, 0);
  const publishedCount = lectures.filter((l) => l.is_published).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {lectures.length}개 VOD · {Math.floor(totalDuration / 60)}시간 {totalDuration % 60}분 · 공개 {publishedCount}개 · 자료 {materials.length}개
          </p>
        </div>
        <AddLectureButton />
      </div>

      {/* Part별 섹션 */}
      {Array.from(partGroups.entries()).map(([partNum, group]) => (
        <Card key={partNum}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">
              Part {partNum}. {group.title}
              <Badge variant="outline" className="ml-2 font-normal">
                {group.lectures.length}개 VOD
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.lectures.map((lec) => {
              const vodId = `vod_${String(lec.vod_number).padStart(2, "0")}`;
              const vodMaterials = materialsByVod.get(vodId) || [];

              return (
                <div
                  key={lec.id}
                  className="border rounded-lg p-4 bg-white dark:bg-zinc-900"
                >
                  {/* VOD 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-bold">
                        {lec.vod_number}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{lec.vod_title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <Clock className="h-3 w-3" />
                          <span>{lec.duration_minutes}분</span>
                          {lec.video_url ? (
                            <Badge variant="default" className="text-[10px] h-4 px-1.5">
                              <Video className="h-2.5 w-2.5 mr-0.5" />영상 있음
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">영상 없음</Badge>
                          )}
                          <Badge variant={lec.is_published ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
                            {lec.is_published ? "공개" : "비공개"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <AddMaterialButton
                        defaultVodId={vodId}
                        triggerVariant="ghost"
                      />
                      <EditLectureButton lecture={lec} />
                      <DeleteLectureButton lectureId={lec.id} />
                    </div>
                  </div>

                  {/* 첨부 자료 */}
                  {vodMaterials.length > 0 && (
                    <div className="mt-3 pl-11 space-y-1.5">
                      {vodMaterials.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-1.5 px-3 rounded bg-zinc-50 dark:bg-zinc-800 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {typeIcons[m.type] || <FileText className="h-4 w-4" />}
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-700 dark:text-zinc-300 hover:text-violet-600 dark:hover:text-violet-300 hover:underline"
                            >
                              {m.title}
                            </a>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              {typeLabels[m.type] || m.type}
                              {m.file_size && ` · ${m.file_size}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <EditMaterialButton material={m} />
                            <DeleteMaterialButton materialId={m.id} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 자료 없으면 추가 버튼만 */}
                  {vodMaterials.length === 0 && (
                    <div className="mt-3 pl-11 flex items-center gap-3">
                      <AddMaterialButton defaultVodId={vodId} triggerVariant="outline" />
                      <span className="text-xs text-zinc-400">첨부 자료 없음</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {lectures.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500 dark:text-zinc-400">
            {t("noLectures")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
