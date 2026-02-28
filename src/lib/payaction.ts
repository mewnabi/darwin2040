// 페이액션 무통장입금 자동확인 유틸리티

const PAYACTION_API_BASE = "https://api.payaction.app";
const PAYACTION_API_KEY = (process.env.PAYACTION_API_KEY || "").trim();
const PAYACTION_MALL_ID = (process.env.PAYACTION_MALL_ID || "").trim();

/** PayAction용 주문번호 생성 (22자 이하) */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `DW${timestamp}${random}`;
}

interface CreateOrderParams {
  orderNumber: string;
  amount: number;
  userName: string;
  userEmail?: string;
}

interface PayActionResponse {
  status: string;
  response?: Record<string, unknown>;
  message?: string;
}

/** 페이액션 주문 생성 API 호출 */
export async function createOrder(
  params: CreateOrderParams,
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${PAYACTION_API_BASE}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PAYACTION_API_KEY,
        "x-mall-id": PAYACTION_MALL_ID,
      },
      body: JSON.stringify({
        order_number: params.orderNumber,
        order_amount: params.amount,
        order_date: new Date().toISOString(),
        billing_name: params.userName,
        orderer_name: params.userName,
        orderer_email: params.userEmail || "",
      }),
    });

    const data: PayActionResponse = await res.json();

    if (!res.ok || data.status !== "success") {
      console.error("페이액션 주문 생성 실패:", data);
      return {
        success: false,
        message: data.message || "주문 생성에 실패했습니다.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("페이액션 주문 생성 오류:", error);
    return { success: false, message: "주문 생성 중 오류가 발생했습니다." };
  }
}
