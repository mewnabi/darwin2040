import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

// POST /api/payments/refund — 환불 처리 (무통장입금: DB 상태 업데이트, 실제 환불은 수동 계좌이체)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { registrationId, reason, cancelAmount } = body;

  if (!registrationId || !reason) {
    return NextResponse.json(
      { error: "registrationId와 reason이 필요합니다." },
      { status: 400 },
    );
  }

  // Registration + Payment 조회
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { payment: true },
  });

  if (!registration) {
    return NextResponse.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
  }

  // 권한 검증: 관리자 또는 본인
  const isAdmin = ADMIN_ROLES.includes(session.user.role);
  if (!isAdmin && registration.userId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const payment = registration.payment;
  if (!payment) {
    return NextResponse.json({ error: "결제 정보가 없습니다." }, { status: 404 });
  }

  if (payment.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "환불 가능한 상태가 아닙니다." },
      { status: 400 },
    );
  }

  // 전액환불 vs 부분환불 결정
  const actualRefundAmount = cancelAmount || payment.amount;
  const isFullRefund = actualRefundAmount >= payment.amount;
  const newPaymentStatus = isFullRefund ? "FULLY_REFUNDED" : "PARTIALLY_REFUNDED";

  // DB 업데이트 (실제 환불 이체는 관리자가 수동 처리)
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        refundAmount: actualRefundAmount,
        refundReason: reason,
        refundedAt: new Date(),
      },
    }),
    prisma.registration.update({
      where: { id: registrationId },
      data: { status: "REFUNDED" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: isFullRefund
      ? "전액 환불 처리되었습니다. 계좌이체로 환불을 진행해주세요."
      : `${actualRefundAmount.toLocaleString()}원 환불 처리되었습니다. 계좌이체로 환불을 진행해주세요.`,
    refundAmount: actualRefundAmount,
  });
}
