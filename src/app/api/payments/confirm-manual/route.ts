import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

// POST /api/payments/confirm-manual — 관리자 수동 입금 확인
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await request.json();
  const { paymentId } = body;

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId가 필요합니다." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { registration: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  if (payment.status === "COMPLETED") {
    return NextResponse.json({ error: "이미 입금 확인된 결제입니다." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        paidAt: new Date(),
      },
    }),
    prisma.registration.update({
      where: { id: payment.registrationId },
      data: { status: "PAID" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "입금 확인 처리되었습니다.",
  });
}
