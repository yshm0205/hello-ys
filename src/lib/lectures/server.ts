import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/utils/supabase/admin";

import type { LectureCatalogChapter } from "./types";

interface LectureRow {
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

function extractVdoCipherId(videoUrl: string | null): string | undefined {
  if (!videoUrl) return undefined;

  const trimmed = videoUrl.trim();
  if (!trimmed) return undefined;

  const knownPatterns = [
    /videos\/([a-zA-Z0-9]+)/,
    /video\/([a-zA-Z0-9]+)/,
    /embed\/([a-zA-Z0-9]+)/,
    /[?&]videoId=([a-zA-Z0-9]+)/,
  ];

  for (const pattern of knownPatterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return trimmed;
}

function shouldShowPracticeCta(partNumber: number) {
  return partNumber === 3;
}

export async function getPublishedLectureChapters(): Promise<LectureCatalogChapter[]> {
  noStore();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("lectures")
    .select(
      "id, part_number, part_title, vod_number, vod_title, duration_minutes, video_url, is_published, sort_order"
    )
    .eq("is_published", true)
    .order("part_number", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("vod_number", { ascending: true });

  if (error) {
    console.error("[Lecture Catalog] Failed to load lectures:", error);
    return [];
  }

  const chapters = new Map<number, LectureCatalogChapter>();

  for (const lecture of (data || []) as LectureRow[]) {
    if (!chapters.has(lecture.part_number)) {
      chapters.set(lecture.part_number, {
        id: `part_${lecture.part_number}`,
        title: `Part ${lecture.part_number}. ${lecture.part_title}`,
        hasPracticeCta: shouldShowPracticeCta(lecture.part_number),
        vods: [],
      });
    }

    chapters.get(lecture.part_number)!.vods.push({
      id: `vod_${String(lecture.vod_number).padStart(2, "0")}`,
      title: lecture.vod_title,
      duration: lecture.duration_minutes || 0,
      vdoCipherId: extractVdoCipherId(lecture.video_url),
    });
  }

  return Array.from(chapters.values());
}
