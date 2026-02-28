import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { confirmPayment } from "@/lib/toss-payments";

// POST /api/payments/confirm — 토스페이먼츠 결제 확인
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { paymentKey, orderId, amount } = body;

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json(
      { error: "paymentKey, orderId, amount가 필요합니다." },
      { status: 400 },
    );
  }

  // orderId로 Payment 조회
  const payment = await prisma.payment.findUnique({
    where: { tossOrderId: orderId },
    include: {
      registration: {
        select: { userId: true, id: true },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  // 본인 확인
  if (payment.registration.userId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 이미 완료된 결제인지 확인
  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: "이미 처리된 결제입니다." },
      { status: 400 },
    );
  }

  // 금액 변조 방지
  if (payment.amount !== amount) {
    return NextResponse.json(
      { error: "결제 금액이 일치하지 않습니다." },
      { status: 400 },
    );
  }

  // 토스페이먼츠 결제 확인
  const result = await confirmPayment(paymentKey, orderId, amount);

  if (!result.success) {
    // 결제 실패 시 Payment 상태 업데이트
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    return NextResponse.json(
      { error: result.message || "결제 확인에 실패했습니다." },
      { status: 400 },
    );
  }

  // 결제 성공 시 Payment + Registration 상태 업데이트
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        tossPaymentKey: paymentKey,
        method: result.data?.method || null,
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
    message: "결제가 완료되었습니다.",
  });
}
