import { NextRequest, NextResponse } from "next/server";

import { getEffectiveCreditInfo } from "@/lib/plans/server";
import {
  PROGRAMS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  canDownloadPrograms,
  getProgramFile,
} from "@/lib/programs/config";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/programs/download?id=topic-windows
// 로그인 + 수강 권한 확인 후, 60초짜리 서명 URL로 리다이렉트한다.
export async function GET(request: NextRequest) {
  try {
    const file = getProgramFile(request.nextUrl.searchParams.get("id"));
    if (!file) {
      return NextResponse.json({ error: "Unknown program" }, { status: 404 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plan = await getEffectiveCreditInfo(user.id);
    if (!canDownloadPrograms(plan?.plan_type, plan?.expires_at)) {
      return NextResponse.json({ error: "수강생 전용 프로그램입니다." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(PROGRAMS_BUCKET)
      .createSignedUrl(file.storagePath, SIGNED_URL_TTL_SECONDS, { download: file.downloadName });

    if (error || !data?.signedUrl) {
      console.error("[programs/download] signed url error:", error);
      return NextResponse.json({ error: "다운로드 링크를 만들지 못했습니다." }, { status: 500 });
    }

    // 환불 판단용 다운로드 기록 (실패해도 다운로드는 진행)
    const { error: logError } = await admin
      .from("program_downloads")
      .insert({ user_id: user.id, program_id: file.id });
    if (logError) {
      console.error("[programs/download] log error:", logError);
    }

    return NextResponse.redirect(data.signedUrl, 302);
  } catch (error) {
    console.error("[programs/download] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
