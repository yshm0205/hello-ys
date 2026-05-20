import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { type CreditAction, deductUserCredits, refundUserCredits } from "@/lib/credits/server";
import {
  getAuthenticatedUser,
  postToScriptGenerator,
} from "@/lib/script-generator/server";
import { createClient } from "@/utils/supabase/server";

function normalizeTokenUsage(value: unknown) {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const totalInput = Number(record.total_input);
  const totalOutput = Number(record.total_output);

  if (!Number.isFinite(totalInput) || !Number.isFinite(totalOutput)) {
    return null;
  }

  const calls = Number(record.calls);
  const normalized: Record<string, number> = {
    total_input: Math.max(0, Math.floor(totalInput)),
    total_output: Math.max(0, Math.floor(totalOutput)),
  };

  if (Number.isFinite(calls)) {
    normalized.calls = Math.max(0, Math.floor(calls));
  }

  return normalized;
}

function normalizeGeneratedScripts(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const script = item && typeof item === "object" ? item as Record<string, unknown> : {};

    return {
      hook_preview: String(script.hook ?? script.hook_preview ?? ""),
      full_script: String(script.final ?? script.full_script ?? ""),
      archetype: "V2_PIPELINE",
    };
  });
}

async function persistGeneratedScript(params: {
  userId: string;
  material: string;
  niche: string;
  tone: string;
  data: Record<string, unknown>;
  fallbackResearchText: string;
}) {
  const scripts = normalizeGeneratedScripts(params.data.scripts);
  if (scripts.length === 0) return null;

  const supabase = await createClient();
  const inputText = params.material.substring(0, 1000);
  const researchText =
    typeof params.data.research_text === "string"
      ? params.data.research_text
      : params.fallbackResearchText;
  const tokenUsage = normalizeTokenUsage(params.data.token_usage);
  const recentCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: recentRows } = await supabase
    .from("script_generations")
    .select("id,scripts,research_text,token_usage")
    .eq("user_id", params.userId)
    .eq("input_text", inputText)
    .gte("created_at", recentCutoff)
    .order("created_at", { ascending: false })
    .limit(5);

  const scriptSignature = JSON.stringify(scripts);
  const duplicate = recentRows?.find((row) => JSON.stringify(row.scripts) === scriptSignature);

  if (duplicate) {
    const updateData: Record<string, unknown> = {};
    if (!duplicate.research_text && researchText) updateData.research_text = researchText;
    if (!duplicate.token_usage && tokenUsage) updateData.token_usage = tokenUsage;

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from("script_generations")
        .update(updateData)
        .eq("id", duplicate.id);
    }

    return duplicate.id as string;
  }

  const insertData: Record<string, unknown> = {
    user_id: params.userId,
    input_text: inputText,
    scripts,
    research_text: researchText,
  };

  if (params.niche) insertData.niche = params.niche;
  if (params.tone) insertData.tone = params.tone;
  if (tokenUsage) insertData.token_usage = tokenUsage;

  const { data, error } = await supabase
    .from("script_generations")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    console.error("[ScriptGenerator V2 Generate] Save failed:", error);
    return null;
  }

  return data.id as string;
}

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
    const savedGenerationId = await persistGeneratedScript({
      userId: user.id,
      material,
      niche,
      tone,
      data,
      fallbackResearchText: researchText,
    });

    return NextResponse.json({
      ...data,
      saved_generation_id: savedGenerationId,
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
