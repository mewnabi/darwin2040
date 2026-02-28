import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculatePrice } from "@/lib/price-calculator";
import { getCancellationRules } from "@/lib/cancellation-rules";
import { generateOrderId, cancelPayment } from "@/lib/toss-payments";

// POST /api/seminars/:id/register — 세미나 신청
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;
  const seminarId = params.id;

  // 요청 body (promotionCode는 선택)
  let promotionCode: string | undefined;
  try {
    const body = await request.json();
    promotionCode = body.promotionCode;
  } catch {
    // body 없어도 됨
  }

  // 세미나 조회
  const seminar = await prisma.seminar.findUnique({
    where: { id: seminarId },
    include: {
      _count: {
        select: {
          registrations: {
            where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
          },
        },
      },
    },
  });

  if (!seminar) {
    return NextResponse.json({ error: "세미나를 찾을 수 없습니다." }, { status: 404 });
  }

  if (seminar.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "현재 신청 가능한 세미나가 아닙니다." },
      { status: 400 },
    );
  }

  // 중복 신청 검사
  const existing = await prisma.registration.findUnique({
    where: { userId_seminarId: { userId, seminarId } },
  });

  if (existing && !["CANCELLED", "REFUNDED"].includes(existing.status)) {
    return NextResponse.json(
      { error: "이미 신청한 세미나입니다." },
      { status: 409 },
    );
  }

  // 유저 tier 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // 프로모션 코드 검증
  let promotionInfo: {
    id: string;
    discountType: string;
    discountValue: number;
    code: string;
  } | null = null;

  if (promotionCode) {
    const promo = await prisma.promotion.findUnique({
      where: { code: promotionCode },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: "유효하지 않은 프로모션 코드입니다." }, { status: 400 });
    }

    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return NextResponse.json({ error: "프로모션 기간이 아닙니다." }, { status: 400 });
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ error: "프로모션 사용 횟수가 초과되었습니다." }, { status: 400 });
    }

    if (promo.seminarId && promo.seminarId !== seminarId) {
      return NextResponse.json({ error: "이 세미나에 적용할 수 없는 프로모션입니다." }, { status: 400 });
    }

    promotionInfo = {
      id: promo.id,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      code: promo.code,
    };
  }

  // 가격 계산
  const priceResult = calculatePrice(
    {
      basePrice: seminar.basePrice,
      regularDiscount: seminar.regularDiscount,
      vipDiscount: seminar.vipDiscount,
      earlyBirdDays: seminar.earlyBirdDays,
      earlyBirdRate: seminar.earlyBirdRate,
      startAt: seminar.startAt,
      userTier: user.tier,
    },
    promotionInfo
      ? {
          discountType: promotionInfo.discountType as "PERCENTAGE" | "FIXED",
          discountValue: promotionInfo.discountValue,
          code: promotionInfo.code,
        }
      : null,
  );

  // 정원 확인
  const activeCount = seminar._count.registrations;
  const isOverCapacity = activeCount >= seminar.maxCapacity;

  // 대기 순번 계산 (정원 초과 시)
  let waitlistNumber: number | null = null;
  let status: "PENDING" | "WAITLISTED" = "PENDING";

  if (isOverCapacity) {
    status = "WAITLISTED";
    const lastWaitlisted = await prisma.registration.findFirst({
      where: {
        seminarId,
        status: "WAITLISTED",
        waitlistNumber: { not: null },
      },
      orderBy: { waitlistNumber: "desc" },
      select: { waitlistNumber: true },
    });
    waitlistNumber = (lastWaitlisted?.waitlistNumber ?? 0) + 1;
  }

  // 무료 세미나인지 확인
  const isFree = priceResult.finalPrice === 0;

  // 트랜잭션: Registration 생성 + Payment 생성 + (프로모션 사용횟수 증가)
  const registration = await prisma.$transaction(async (tx) => {
    // 이전에 취소/환불된 레코드가 있으면 삭제 후 재생성
    if (existing && ["CANCELLED", "REFUNDED"].includes(existing.status)) {
      // 연관 Payment도 함께 삭제
      await tx.payment.deleteMany({
        where: { registrationId: existing.id },
      });
      await tx.registration.delete({
        where: { id: existing.id },
      });
    }

    // 무료 세미나는 바로 PAID, 대기자는 WAITLISTED 유지
    const regStatus = status === "WAITLISTED" ? "WAITLISTED" : isFree ? "PAID" : status;

    const reg = await tx.registration.create({
      data: {
        userId,
        seminarId,
        status: regStatus,
        waitlistNumber,
        originalPrice: priceResult.originalPrice,
        discountAmount: priceResult.discountAmount,
        finalPrice: priceResult.finalPrice,
        discountDetail: JSON.stringify(priceResult.discounts),
        promotionCode: promotionCode || null,
      },
      include: {
        seminar: {
          select: { id: true, title: true, startAt: true, venue: true },
        },
      },
    });

    // 유료 세미나 + 대기자가 아닌 경우: Payment 레코드 생성
    if (!isFree && status !== "WAITLISTED") {
      await tx.payment.create({
        data: {
          registrationId: reg.id,
          seminarId,
          tossOrderId: generateOrderId(),
          amount: priceResult.finalPrice,
          status: "PENDING",
        },
      });
    }

    // 프로모션 사용횟수 증가
    if (promotionInfo) {
      await tx.promotion.update({
        where: { id: promotionInfo.id },
        data: { currentUses: { increment: 1 } },
      });
    }

    // Payment 포함하여 반환
    return tx.registration.findUnique({
      where: { id: reg.id },
      include: {
        seminar: {
          select: { id: true, title: true, startAt: true, venue: true },
        },
        payment: true,
      },
    });
  });

  const message =
    status === "WAITLISTED"
      ? `대기 신청이 완료되었습니다. (대기 순번: ${waitlistNumber}번)`
      : isFree
        ? "세미나 신청이 완료되었습니다."
        : "세미나 신청이 완료되었습니다. 결제를 진행해주세요.";

  return NextResponse.json({ registration, message }, { status: 201 });
}

// DELETE /api/seminars/:id/register — 세미나 신청 취소
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;
  const seminarId = params.id;

  // 신청 조회 (Payment 포함)
  const registration = await prisma.registration.findUnique({
    where: { userId_seminarId: { userId, seminarId } },
    include: {
      seminar: { select: { startAt: true, title: true } },
      payment: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "신청 내역을 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미 취소/환불/불참 상태 검사
  if (["CANCELLED", "REFUNDED", "NO_SHOW"].includes(registration.status)) {
    return NextResponse.json(
      { error: "이미 취소된 신청입니다." },
      { status: 400 },
    );
  }

  // WAITLISTED는 즉시 취소 가능 (위약금 없음)
  if (registration.status === "WAITLISTED") {
    const updated = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.update({
        where: { id: registration.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      // 프로모션 사용횟수 감소
      if (registration.promotionCode) {
        await tx.promotion.updateMany({
          where: { code: registration.promotionCode, currentUses: { gt: 0 } },
          data: { currentUses: { decrement: 1 } },
        });
      }

      return reg;
    });

    return NextResponse.json({
      registration: updated,
      refundPercent: 100,
      penaltyPercent: 0,
      message: "대기 신청이 취소되었습니다.",
    });
  }

  // 일반 취소: 시간 기반 위약금 적용
  const rules = getCancellationRules(registration.seminar.startAt);

  if (!rules.canCancel) {
    return NextResponse.json({ error: rules.reason }, { status: 400 });
  }

  // 결제 완료 상태에서 환불이 필요한 경우
  const payment = registration.payment;
  const needsRefund =
    payment &&
    payment.status === "COMPLETED" &&
    payment.tossPaymentKey &&
    rules.refundPercent > 0;

  if (needsRefund) {
    const cancelAmount =
      rules.refundPercent === 100
        ? undefined // 전액환불
        : Math.floor((payment.amount * rules.refundPercent) / 100); // 부분환불

    const cancelResult = await cancelPayment(
      payment.tossPaymentKey!,
      `세미나 취소 (환불 ${rules.refundPercent}%)`,
      cancelAmount,
    );

    if (!cancelResult.success) {
      return NextResponse.json(
        { error: cancelResult.message || "환불 처리에 실패했습니다." },
        { status: 500 },
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const newStatus = needsRefund ? "REFUNDED" : "CANCELLED";
    const reg = await tx.registration.update({
      where: { id: registration.id },
      data: { status: newStatus, cancelledAt: new Date() },
    });

    // 환불 시 Payment 상태 업데이트
    if (needsRefund && payment) {
      const refundAmount =
        rules.refundPercent === 100
          ? payment.amount
          : Math.floor((payment.amount * rules.refundPercent) / 100);

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: rules.refundPercent === 100 ? "FULLY_REFUNDED" : "PARTIALLY_REFUNDED",
          refundAmount,
          refundReason: `세미나 취소 (환불 ${rules.refundPercent}%)`,
          refundedAt: new Date(),
        },
      });
    }

    // 프로모션 사용횟수 감소
    if (registration.promotionCode) {
      await tx.promotion.updateMany({
        where: { code: registration.promotionCode, currentUses: { gt: 0 } },
        data: { currentUses: { decrement: 1 } },
      });
    }

    // 다음 대기자 승격
    const nextWaitlisted = await tx.registration.findFirst({
      where: { seminarId, status: "WAITLISTED" },
      orderBy: { waitlistNumber: "asc" },
    });

    if (nextWaitlisted) {
      await tx.registration.update({
        where: { id: nextWaitlisted.id },
        data: {
          status: "PROMOTED",
          promotedAt: new Date(),
          waitlistNumber: null,
        },
      });
    }

    return reg;
  });

  return NextResponse.json({
    registration: updated,
    refundPercent: rules.refundPercent,
    penaltyPercent: rules.penaltyPercent,
    message:
      needsRefund
        ? rules.penaltyPercent > 0
          ? `취소되었습니다. ${rules.refundPercent}% 환불 처리됩니다.`
          : "취소되었습니다. 전액 환불됩니다."
        : rules.penaltyPercent > 0
          ? `취소되었습니다. (위약금 ${rules.penaltyPercent}% 적용)`
          : "취소되었습니다.",
  });
}
