import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "비밀번호는 8자 이상으로 입력해 주세요." },
      { status: 400 },
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { error: "비밀번호는 128자 이하로 입력해 주세요." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("[Account Password] update failed:", error);
    return NextResponse.json(
      { error: "비밀번호 변경에 실패했습니다. 다시 시도해 주세요." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
