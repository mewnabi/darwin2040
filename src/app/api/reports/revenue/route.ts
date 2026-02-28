import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // TODO: 매출 보고서
  return NextResponse.json(
    { message: "매출 보고서 API — 개발 예정" },
    { status: 501 },
  );
}
