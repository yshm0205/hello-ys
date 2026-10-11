import { isActiveAccessPlan, isInitialProgramPlan } from "@/lib/plans/config";

// 수강생 전용 프로그램 — 파일은 Supabase Storage의 비공개 버킷에 두고,
// 다운로드 때마다 짧게 유효한 서명 URL을 발급한다.
export const PROGRAMS_BUCKET = "programs";
export const SIGNED_URL_TTL_SECONDS = 60;

export type ProgramId = "topic-windows" | "topic-mac-arm" | "topic-mac-intel";

export type ProgramFile = {
  id: ProgramId;
  os: "windows" | "mac";
  label: string;
  description: string;
  storagePath: string; // 버킷 안 경로 (ASCII만)
  downloadName: string; // 사용자가 받는 파일 이름
  sizeLabel: string;
};

export const TOPIC_PROGRAM_FILES: ProgramFile[] = [
  {
    id: "topic-windows",
    os: "windows",
    label: "Windows",
    description: "Windows 10 / 11",
    storagePath: "topic-finder/windows/topic-finder.exe",
    downloadName: "주제 선정 프로그램.exe",
    sizeLabel: "33MB",
  },
  {
    id: "topic-mac-arm",
    os: "mac",
    label: "Mac (M1·M2·M3·M4)",
    description: "Apple 실리콘 칩 Mac",
    storagePath: "topic-finder/mac/topic-finder-mac-apple-silicon.zip",
    downloadName: "주제 선정 프로그램 (M1 M2 M3 M4).zip",
    sizeLabel: "61MB",
  },
  {
    id: "topic-mac-intel",
    os: "mac",
    label: "Mac (Intel)",
    description: "Intel 칩 Mac",
    storagePath: "topic-finder/mac/topic-finder-mac-intel.zip",
    downloadName: "주제 선정 프로그램 (Intel).zip",
    sizeLabel: "57MB",
  },
];

export function getProgramFile(id: string | null | undefined) {
  return TOPIC_PROGRAM_FILES.find((file) => file.id === id) ?? null;
}

// 올인원(강의) 구매자는 이용 기간이 끝나도 받을 수 있고, 그 외에는 활성 유료 플랜만.
export function canDownloadPrograms(planType?: string | null, expiresAt?: string | null) {
  return isInitialProgramPlan(planType) || isActiveAccessPlan(planType, expiresAt);
}
