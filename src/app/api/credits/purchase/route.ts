import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "이 경로는 더 이상 사용하지 않습니다. 토스 결제 플로우를 이용해 주세요.",
    },
    { status: 410 },
  );
}
