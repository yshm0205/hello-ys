import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { type CreditAction, deductUserCredits, refundUserCredits } from "@/lib/credits/server";
import {
  getAuthenticatedUser,
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

  const body = await request.json().catch(() => ({}));
  const material = typeof body.material === "string" ? body.material.trim() : "";
  const researchText =
    typeof body.research_text === "string" ? body.research_text : "";
  const niche = typeof body.niche === "string" ? body.niche : "";
  const tone = typeof body.tone === "string" ? body.tone : "";
  const forceMode = typeof body.force_mode === "string" ? body.force_mode : "";

  if (material.length < 10) {
    return NextResponse.json(
      { success: false, error: "소재를 10자 이상 입력해주세요." },
      { status: 400 },
    );
  }

  // saga 모드는 SceneExpander 추가로 +2cr
  const creditAction: CreditAction =
    niche === "lifetips" && forceMode === "saga" ? "generate_skip_saga" : "generate_skip";

  const referenceId = `${creditAction}:${user.id}:${randomUUID()}`;
  const deduction = await deductUserCredits(user.id, creditAction, {
    referenceId,
    metadata: {
      source: "v2_generate_route",
      niche,
      tone,
      forceMode,
    },
  });

  if (!deduction.success) {
    return NextResponse.json(
      {
        success: false,
        credits: deduction.credits,
        error: deduction.error,
      },
      { status: deduction.status },
    );
  }

  try {
    const data = await postToScriptGenerator<Record<string, unknown>>("/api/v2/generate", {
      material,
      research_text: researchText,
      niche,
      tone,
      force_mode: forceMode,
      user_id: user.id,
    });

    return NextResponse.json({
      ...data,
      credits: deduction.credits,
    });
  } catch (error) {
    const refund = await refundUserCredits(
      user.id,
      deduction.deducted,
      referenceId,
      "generate_failed",
    );

    if (!refund.success) {
      console.error("[ScriptGenerator V2 Generate] Refund failed:", {
        userId: user.id,
        referenceId,
      });
    }

    const message =
      error instanceof Error && error.message !== "missing_api_secret_key"
        ? error.message
        : "스크립트 생성에 실패했습니다.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
