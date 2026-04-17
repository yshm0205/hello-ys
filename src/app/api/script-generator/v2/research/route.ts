import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { deductUserCredits, refundUserCredits } from "@/lib/credits/server";
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
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";

  if (topic.length < 5) {
    return NextResponse.json(
      { success: false, error: "주제를 5자 이상 입력해주세요." },
      { status: 400 },
    );
  }

  const referenceId = `research:${user.id}:${randomUUID()}`;
  const deduction = await deductUserCredits(user.id, "research", {
    referenceId,
    metadata: {
      source: "v2_research_route",
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
    const data = await postToScriptGenerator<Record<string, unknown>>("/api/research", {
      topic,
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
      "research_failed",
    );

    if (!refund.success) {
      console.error("[ScriptGenerator V2 Research] Refund failed:", {
        userId: user.id,
        referenceId,
      });
    }

    const message =
      error instanceof Error && error.message !== "missing_api_secret_key"
        ? error.message
        : "리서치 처리에 실패했습니다.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
