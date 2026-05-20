/**
 * Script Save API Route
 * Saves generated scripts to the user's archive.
 */

import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

function normalizeTokenUsage(value: unknown) {
    if (!value || typeof value !== "object") return null;

    const record = value as Record<string, unknown>;
    const totalInput = Number(record.total_input);
    const totalOutput = Number(record.total_output);

    if (!Number.isFinite(totalInput) || !Number.isFinite(totalOutput)) {
        return null;
    }

    const normalized: Record<string, number> = {
        total_input: Math.max(0, Math.floor(totalInput)),
        total_output: Math.max(0, Math.floor(totalOutput)),
    };

    const calls = Number(record.calls);
    if (Number.isFinite(calls)) {
        normalized.calls = Math.max(0, Math.floor(calls));
    }

    return normalized;
}

function resolveResearchText(body: Record<string, unknown>) {
    const candidates = [
        body.research_text,
        body.researchText,
        body.research_result,
        body.research && typeof body.research === "object"
            ? (body.research as Record<string, unknown>).text
            : undefined,
    ];

    const value = candidates.find((candidate) => typeof candidate === "string");
    return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "스크립트를 저장하려면 로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { input_text, scripts, selected_script, niche, tone, token_usage } = body;

        if (!input_text) {
            return NextResponse.json(
                { error: "입력 텍스트가 필요합니다." },
                { status: 400 }
            );
        }

        const scriptData = scripts || (selected_script ? [selected_script] : []);
        const inputText = String(input_text).substring(0, 1000);
        const normalizedTokenUsage = normalizeTokenUsage(token_usage);
        const resolvedResearchText = resolveResearchText(body);

        const { data: recentRows } = await supabase
            .from("script_generations")
            .select("id,scripts,research_text,token_usage")
            .eq("user_id", user.id)
            .eq("input_text", inputText)
            .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
            .order("created_at", { ascending: false })
            .limit(5);

        const scriptSignature = JSON.stringify(scriptData);
        const duplicate = recentRows?.find((row) => JSON.stringify(row.scripts) === scriptSignature);

        if (duplicate) {
            const updateData: Record<string, unknown> = {};
            if (!duplicate.research_text && resolvedResearchText) updateData.research_text = resolvedResearchText;
            if (!duplicate.token_usage && normalizedTokenUsage) updateData.token_usage = normalizedTokenUsage;

            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from("script_generations")
                    .update(updateData)
                    .eq("id", duplicate.id);
            }

            return NextResponse.json({
                success: true,
                id: duplicate.id,
                message: "스크립트가 저장되었습니다!",
                deduped: true,
            });
        }

        const insertData: Record<string, unknown> = {
            user_id: user.id,
            input_text: inputText,
            scripts: scriptData,
            research_text: resolvedResearchText,
        };
        if (niche) insertData.niche = niche;
        if (tone) insertData.tone = tone;
        if (normalizedTokenUsage) insertData.token_usage = normalizedTokenUsage;

        const { data, error } = await supabase
            .from("script_generations")
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error("[Script Save API] DB Error:", error);
            return NextResponse.json(
                { error: "저장에 실패했습니다." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            id: data.id,
            message: "스크립트가 저장되었습니다!",
        });

    } catch (error) {
        console.error("[Script Save API] Error:", error);
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
