import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSeminarQRCode, generateQRImage } from "@/lib/qr";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const seminar = await prisma.seminar.findUnique({
    where: { id: params.id },
  });

  if (!seminar) {
    return NextResponse.json(
      { error: "세미나를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const regenerate =
    request.nextUrl.searchParams.get("regenerate") === "true";

  let qrCode = seminar.qrCode;
  let qrValidFrom = seminar.qrValidFrom;
  let qrValidUntil = seminar.qrValidUntil;

  // QR 코드가 없거나 재생성 요청 시 새로 생성
  if (!qrCode || regenerate) {
    qrCode = generateSeminarQRCode();
    // 유효 시간: 세미나 시작 30분 전 ~ 종료 30분 후
    qrValidFrom = new Date(seminar.startAt.getTime() - 30 * 60 * 1000);
    qrValidUntil = new Date(seminar.endAt.getTime() + 30 * 60 * 1000);

    await prisma.seminar.update({
      where: { id: params.id },
      data: { qrCode, qrValidFrom, qrValidUntil },
    });
  }

  // QR 이미지 생성 — 체크인 URL을 인코딩
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const qrUrl = `${baseUrl}/member/seminars/${params.id}/checkin?code=${qrCode}`;
  const qrImageDataUrl = await generateQRImage(qrUrl);

  return NextResponse.json({
    qrCode,
    qrImageDataUrl,
    qrUrl,
    validFrom: qrValidFrom!.toISOString(),
    validUntil: qrValidUntil!.toISOString(),
  });
}
