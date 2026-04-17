import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "구형 스크립트 생성 API는 더 이상 사용할 수 없습니다. V2 생성기를 이용해주세요.",
    },
    { status: 410 },
  );
}
