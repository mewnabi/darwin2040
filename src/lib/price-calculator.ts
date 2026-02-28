import type { DiscountDetail } from "@/types/payment";

interface PriceInput {
  basePrice: number;
  regularDiscount: number; // %
  vipDiscount: number; // %
  earlyBirdDays: number;
  earlyBirdRate: number; // %
  startAt: Date | string;
  userTier: string; // MemberTier enum value
}

interface PromotionInfo {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  code: string;
}

interface PriceResult {
  originalPrice: number;
  discounts: DiscountDetail[];
  discountAmount: number;
  finalPrice: number;
}

function isEarlyBird(startAt: Date | string, earlyBirdDays: number): boolean {
  if (earlyBirdDays <= 0) return false;
  const daysUntil = Math.ceil(
    (new Date(startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  return daysUntil >= earlyBirdDays;
}

function getTierDiscountRate(
  tier: string,
  regularDiscount: number,
  vipDiscount: number,
): number {
  switch (tier) {
    case "REGULAR":
      return regularDiscount;
    case "VIP":
      return vipDiscount;
    default:
      // ASSOCIATE, GUEST — no tier discount
      return 0;
  }
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case "REGULAR":
      return "정회원 할인";
    case "VIP":
      return "VIP 할인";
    default:
      return "";
  }
}

/**
 * 가격 계산: 등급 할인 → 얼리버드 → 프로모션 코드 (순차 적용)
 */
export function calculatePrice(
  input: PriceInput,
  promotion?: PromotionInfo | null,
): PriceResult {
  const {
    basePrice,
    regularDiscount,
    vipDiscount,
    earlyBirdDays,
    earlyBirdRate,
    startAt,
    userTier,
  } = input;

  if (basePrice === 0) {
    return { originalPrice: 0, discounts: [], discountAmount: 0, finalPrice: 0 };
  }

  const discounts: DiscountDetail[] = [];
  let currentPrice = basePrice;

  // 1. 등급 할인
  const tierRate = getTierDiscountRate(userTier, regularDiscount, vipDiscount);
  if (tierRate > 0) {
    const amount = Math.round(currentPrice * (tierRate / 100));
    discounts.push({
      type: "TIER",
      label: getTierLabel(userTier),
      rate: tierRate,
      amount,
    });
    currentPrice -= amount;
  }

  // 2. 얼리버드 할인
  if (isEarlyBird(startAt, earlyBirdDays) && earlyBirdRate > 0) {
    const amount = Math.round(currentPrice * (earlyBirdRate / 100));
    discounts.push({
      type: "EARLY_BIRD",
      label: "얼리버드 할인",
      rate: earlyBirdRate,
      amount,
    });
    currentPrice -= amount;
  }

  // 3. 프로모션 코드
  if (promotion) {
    let amount: number;
    if (promotion.discountType === "PERCENTAGE") {
      amount = Math.round(currentPrice * (promotion.discountValue / 100));
    } else {
      amount = Math.min(promotion.discountValue, currentPrice);
    }
    if (amount > 0) {
      discounts.push({
        type: "PROMOTION",
        label: `프로모션 (${promotion.code})`,
        rate:
          promotion.discountType === "PERCENTAGE"
            ? promotion.discountValue
            : Math.round((amount / currentPrice) * 100),
        amount,
      });
      currentPrice -= amount;
    }
  }

  const finalPrice = Math.max(0, currentPrice);
  const discountAmount = basePrice - finalPrice;

  return { originalPrice: basePrice, discounts, discountAmount, finalPrice };
}
