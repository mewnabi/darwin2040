import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePortalToken, getTokenExpiry } from "@/lib/token";
import { sendAlimtalk } from "@/lib/kakao-alimtalk";

// POST /api/speakers/[id]/request-info - 연사 정보 요청 (토큰 생성)
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const speaker = await prisma.speaker.findUnique({
    where: { id: params.id },
  });

  if (!speaker) {
    return NextResponse.json(
      { error: "연사를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  if (speaker.status !== "CONFIRMED" && speaker.status !== "INFO_REVIEWING") {
    return NextResponse.json(
      { error: "확정 또는 검토 중 상태의 연사만 정보 요청이 가능합니다" },
      { status: 400 },
    );
  }

  const token = generatePortalToken();
  const expiry = getTokenExpiry(7);

  const updated = await prisma.speaker.update({
    where: { id: params.id },
    data: {
      portalToken: token,
      portalTokenExp: expiry,
      status: "INFO_REQUESTED",
    },
  });

  const portalUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/speaker/${token}`;

  // 알림톡 발송 (현재 console.log)
  if (updated.phone) {
    await sendAlimtalk(updated.phone, "SPEAKER_INFO_REQUEST", {
      name: updated.name,
      portalUrl,
    });
  }

  return NextResponse.json({
    portalUrl,
    token,
    expiresAt: expiry.toISOString(),
  });
}
