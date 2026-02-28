import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createOrder } from "@/lib/payaction";

// POST /api/payments/update-depositor — 입금자명 업데이트 (페이액션 주문 재생성)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { orderId, depositorName } = body;

  if (!orderId || !depositorName) {
    return NextResponse.json(
      { error: "orderId와 depositorName이 필요합니다." },
      { status: 400 },
    );
  }

  // 본인 결제인지 확인
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: {
      registration: {
        select: { userId: true },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "결제 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  if (payment.registration.userId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // DB에 입금자명 저장
  await prisma.payment.update({
    where: { orderId },
    data: { depositorName: depositorName.trim() },
  });

  // 페이액션 주문 재생성 (입금자명 변경)
  const result = await createOrder({
    orderNumber: orderId,
    amount: payment.amount,
    userName: depositorName.trim(),
    userEmail: session.user.email || undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.message || "입금자명 업데이트에 실패했습니다. (DB에는 저장됨)" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: "입금자명이 업데이트되었습니다." });
}
