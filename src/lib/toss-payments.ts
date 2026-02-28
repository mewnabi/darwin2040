// 토스페이먼츠 결제 유틸리티

export const TOSS_PAYMENTS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || "";
export const TOSS_PAYMENTS_SECRET_KEY =
  process.env.TOSS_PAYMENTS_SECRET_KEY || "";

const TOSS_API_BASE = "https://api.tosspayments.com/v1";

function getAuthHeader(): string {
  const encoded = Buffer.from(`${TOSS_PAYMENTS_SECRET_KEY}:`).toString("base64");
  return `Basic ${encoded}`;
}

export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `DARWIN-${timestamp}-${random}`;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method?: string;
  totalAmount: number;
  approvedAt?: string;
  [key: string]: unknown;
}

interface TossErrorResponse {
  code: string;
  message: string;
}

export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
): Promise<{ success: boolean; data?: TossPaymentResponse; message?: string }> {
  try {
    const res = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    if (!res.ok) {
      const error: TossErrorResponse = await res.json();
      return { success: false, message: error.message || "결제 확인에 실패했습니다." };
    }

    const data: TossPaymentResponse = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("토스페이먼츠 결제 확인 오류:", error);
    return { success: false, message: "결제 확인 중 오류가 발생했습니다." };
  }
}

export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number,
): Promise<{ success: boolean; data?: TossPaymentResponse; message?: string }> {
  try {
    const body: Record<string, unknown> = { cancelReason };
    if (cancelAmount !== undefined) {
      body.cancelAmount = cancelAmount;
    }

    const res = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}/cancel`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error: TossErrorResponse = await res.json();
      return { success: false, message: error.message || "결제 취소에 실패했습니다." };
    }

    const data: TossPaymentResponse = await res.json();
    return { success: true, data };
  } catch (error) {
    console.error("토스페이먼츠 결제 취소 오류:", error);
    return { success: false, message: "결제 취소 중 오류가 발생했습니다." };
  }
}
