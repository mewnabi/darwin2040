import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAYACTION_WEBHOOK_KEY = (process.env.PAYACTION_WEBHOOK_KEY || "").trim();
const PAYACTION_MALL_ID = (process.env.PAYACTION_MALL_ID || "").trim();

// POST /api/payments/payaction-webhook — 페이액션 매칭완료 웹훅
export async function POST(request: NextRequest) {
  // 웹훅 키 검증
  const webhookKey = request.headers.get("x-webhook-key");
  if (!webhookKey || webhookKey !== PAYACTION_WEBHOOK_KEY) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  // 상점 ID 검증
  const mallId = request.headers.get("x-mall-id");
  if (!mallId || mallId !== PAYACTION_MALL_ID) {
    return NextResponse.json(
      { status: "error", message: "Invalid mall ID" },
      { status: 401 },
    );
  }

  let body: {
    order_number?: string;
    order_status?: string;
    processing_date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid request body" },
      { status: 400 },
    );
  }

  const { order_number, order_status } = body;

  if (!order_number) {
    return NextResponse.json(
      { status: "error", message: "order_number is required" },
      { status: 400 },
    );
  }

  // 매칭완료 상태만 처리
  if (order_status !== "매칭완료") {
    return NextResponse.json({ status: "success" });
  }

  // Payment 조회 (orderId 필드 = PayAction order_number)
  const payment = await prisma.payment.findUnique({
    where: { orderId: order_number },
    include: { registration: true },
  });

  if (!payment) {
    return NextResponse.json(
      { status: "error", message: "Payment not found" },
      { status: 404 },
    );
  }

  // 이미 완료된 결제는 중복 처리 방지 (멱등성)
  if (payment.status === "COMPLETED") {
    return NextResponse.json({ status: "success" });
  }

  // Payment → COMPLETED, Registration → PAID 업데이트
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

  return NextResponse.json({ status: "success" });
}
