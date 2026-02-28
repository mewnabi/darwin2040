import type { Seminar } from "./seminar";

// ─── Prisma-aligned enums ──────────────────────────

export type RegistrationStatus =
  | "PENDING"
  | "PAID"
  | "WAITLISTED"
  | "PROMOTED"
  | "CANCELLED"
  | "REFUNDED"
  | "NO_SHOW";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "PARTIALLY_REFUNDED"
  | "FULLY_REFUNDED"
  | "CANCELLED";

// ─── Core interfaces ───────────────────────────────

export interface DiscountDetail {
  type: "TIER" | "EARLY_BIRD" | "PROMOTION";
  label: string;
  rate: number; // percent
  amount: number; // 할인 금액 (원)
}

export interface Registration {
  id: string;
  userId: string;
  seminarId: string;
  status: RegistrationStatus;
  waitlistNumber?: number | null;

  // 가격
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountDetail?: string | null; // JSON: DiscountDetail[]
  promotionCode?: string | null;

  // 시간
  registeredAt: string;
  cancelledAt?: string | null;
  promotedAt?: string | null;

  // 관계
  seminar?: Seminar;
  payment?: Payment | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  registrationId: string;
  seminarId: string;

  // 결제 정보
  paymentKey?: string | null;
  orderId?: string | null;
  method?: string | null;

  amount: number;
  status: PaymentStatus;

  // 환불
  refundAmount: number;
  refundReason?: string | null;
  refundedAt?: string | null;

  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Request / Response DTOs ───────────────────────

export interface RegisterRequest {
  promotionCode?: string;
}

export interface RegisterResponse {
  registration: Registration;
  message: string;
}

export interface CancelResponse {
  registration: Registration;
  refundPercent: number;
  penaltyPercent: number;
  message: string;
}

export interface PricePreview {
  originalPrice: number;
  discounts: DiscountDetail[];
  discountAmount: number;
  finalPrice: number;
  isWaitlisted: boolean;
  currentRegistrations: number;
  maxCapacity: number;
}

// ─── Payment API DTOs ────────────────────────────

export interface PaymentRefundRequest {
  registrationId: string;
  reason: string;
  cancelAmount?: number;
}

export interface PaymentWithDetails extends Payment {
  registration: Registration & {
    user: { id: string; name: string; email: string };
    seminar: { id: string; title: string };
  };
}

export interface PaymentSummary {
  date: string;
  totalAmount: number;
  totalCount: number;
  refundAmount: number;
  netAmount: number;
}
