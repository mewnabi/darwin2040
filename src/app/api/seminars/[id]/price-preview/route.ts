import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculatePrice } from "@/lib/price-calculator";

// POST /api/seminars/:id/price-preview — 가격 미리보기
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const seminarId = params.id;

  // 프로모션 코드 (선택)
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

  // 유저 tier 조회
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tier: true },
  });

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // 프로모션 코드 검증
  let promotionInfo: {
    discountType: "PERCENTAGE" | "FIXED";
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
      discountType: promo.discountType as "PERCENTAGE" | "FIXED",
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
    promotionInfo,
  );

  const activeCount = seminar._count.registrations;

  return NextResponse.json({
    ...priceResult,
    isWaitlisted: activeCount >= seminar.maxCapacity,
    currentRegistrations: activeCount,
    maxCapacity: seminar.maxCapacity,
  });
}
