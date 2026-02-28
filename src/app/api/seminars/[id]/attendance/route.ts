import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isQRValid } from "@/lib/qr";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

// POST /api/seminars/[id]/attendance — 체크인 (QR 또는 수동)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const seminar = await prisma.seminar.findUnique({
    where: { id: params.id },
  });

  if (!seminar) {
    return NextResponse.json(
      { error: "세미나를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  // 수동 체크인 (관리자)
  if (body.method === "MANUAL" && body.userId) {
    if (!ADMIN_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 },
      );
    }

    // 해당 유저의 신청 확인
    const registration = await prisma.registration.findUnique({
      where: {
        userId_seminarId: {
          userId: body.userId,
          seminarId: params.id,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "해당 회원의 세미나 신청을 찾을 수 없습니다" },
        { status: 400 },
      );
    }

    // 중복 체크인 방지
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_seminarId: {
          userId: body.userId,
          seminarId: params.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 출석 체크된 회원입니다" },
        { status: 409 },
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: body.userId,
        seminarId: params.id,
        method: "MANUAL",
        memo: body.memo || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, tier: true },
        },
      },
    });

    return NextResponse.json({
      attendance,
      message: "수동 체크인이 완료되었습니다",
    });
  }

  // QR 체크인 (회원)
  const { code } = body;
  if (!code) {
    return NextResponse.json(
      { error: "QR 코드가 필요합니다" },
      { status: 400 },
    );
  }

  // QR 코드 일치 확인
  if (seminar.qrCode !== code) {
    return NextResponse.json(
      { error: "유효하지 않은 QR 코드입니다" },
      { status: 400 },
    );
  }

  // QR 유효시간 확인
  if (!isQRValid(seminar.qrValidFrom, seminar.qrValidUntil)) {
    return NextResponse.json(
      { error: "QR 코드 유효 시간이 아닙니다" },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // 결제완료 신청 확인
  const registration = await prisma.registration.findUnique({
    where: {
      userId_seminarId: {
        userId,
        seminarId: params.id,
      },
    },
  });

  if (!registration) {
    return NextResponse.json(
      { error: "세미나 신청 내역이 없습니다" },
      { status: 400 },
    );
  }

  if (registration.status !== "PAID") {
    return NextResponse.json(
      { error: "결제가 완료되지 않은 신청입니다" },
      { status: 400 },
    );
  }

  // 중복 체크인 방지
  const existing = await prisma.attendance.findUnique({
    where: {
      userId_seminarId: {
        userId,
        seminarId: params.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "이미 출석 체크가 완료되었습니다" },
      { status: 409 },
    );
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      seminarId: params.id,
      method: "QR",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, tier: true },
      },
    },
  });

  return NextResponse.json({
    attendance,
    message: "체크인이 완료되었습니다!",
  });
}

// GET /api/seminars/[id]/attendance — 출석 목록 (관리자)
export async function GET(
  _request: NextRequest,
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

  // 결제완료(PAID) 신청자 + 출석 정보 JOIN
  const registrations = await prisma.registration.findMany({
    where: {
      seminarId: params.id,
      status: "PAID",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, tier: true },
      },
    },
    orderBy: { registeredAt: "asc" },
  });

  const attendances = await prisma.attendance.findMany({
    where: { seminarId: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, tier: true },
      },
    },
  });

  // 출석 맵 구성
  const attendanceMap = new Map(
    attendances.map((a) => [a.userId, a]),
  );

  // 신청자 목록에 출석 정보 결합
  const registrationsWithAttendance = registrations.map((reg) => ({
    id: reg.id,
    userId: reg.userId,
    status: reg.status,
    user: reg.user,
    attendance: attendanceMap.get(reg.userId) || null,
  }));

  const total = registrations.length;
  const checkedIn = attendances.length;

  return NextResponse.json({
    registrations: registrationsWithAttendance,
    stats: {
      total,
      checkedIn,
      rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
    },
  });
}
