import { NextRequest, NextResponse } from "next/server";

import {
  getAuthenticatedUser,
  isEntertainmentReactionAllowed,
  postToScriptGenerator,
} from "@/lib/script-generator/server";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  if (!isEntertainmentReactionAllowed(user)) {
    return NextResponse.json(
      { success: false, error: "아직 베타 허용 계정에서만 사용할 수 있습니다." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const sourceText = typeof body.source_text === "string" ? body.source_text.trim() : "";
  const targetLines =
    typeof body.target_lines === "string" && body.target_lines.trim()
      ? body.target_lines.trim()
      : "24-32";
  const direction = typeof body.direction === "string" ? body.direction : "";
  const category = typeof body.category === "string" ? body.category : "";
  const topHook = typeof body.top_hook === "string" ? body.top_hook : "";

  if (sourceText.length < 20) {
    return NextResponse.json(
      { success: false, error: "선택한 원본 구간/상황 원문을 20자 이상 붙여넣어 주세요." },
      { status: 400 },
    );
  }

  try {
    const data = await postToScriptGenerator<Record<string, unknown>>(
      "/api/entertainment-reaction/generate",
      {
        source_text: sourceText,
        account_id: user.email || user.id,
        user_id: user.id,
        target_lines: targetLines,
        direction,
        category,
        top_hook: topHook,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error && error.message !== "missing_api_secret_key"
        ? error.message
        : "반응 쇼츠 스크립트 생성에 실패했습니다.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
