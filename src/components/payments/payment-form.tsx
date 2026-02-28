"use client";

import { useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import type { TossPaymentsInstance } from "@tosspayments/payment-sdk";
import { Loader2, CreditCard, Building2, Smartphone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentFormProps {
  clientKey: string;
  orderId: string;
  amount: number;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  seminarId: string;
}

type PaymentMethod = "카드" | "계좌이체" | "가상계좌";

const METHODS: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: "카드", label: "카드 결제", icon: CreditCard },
  { value: "계좌이체", label: "계좌이체", icon: Building2 },
  { value: "가상계좌", label: "가상계좌", icon: Smartphone },
];

export function PaymentForm({
  clientKey,
  orderId,
  amount,
  orderName,
  customerEmail,
  customerName,
  seminarId,
}: PaymentFormProps) {
  const [tossPayments, setTossPayments] = useState<TossPaymentsInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("카드");

  useEffect(() => {
    async function init() {
      try {
        const tp = await loadTossPayments(clientKey);
        setTossPayments(tp);
        setIsReady(true);
      } catch (err) {
        console.error("토스페이먼츠 초기화 오류:", err);
        setError("결제 모듈을 불러오는데 실패했습니다.");
      }
    }

    if (clientKey && amount > 0) {
      init();
    }
  }, [clientKey, amount]);

  const handlePayment = async () => {
    if (!tossPayments) return;
    setIsLoading(true);
    setError(null);

    try {
      await tossPayments.requestPayment(selectedMethod, {
        amount,
        orderId,
        orderName,
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
        successUrl: `${window.location.origin}/member/seminars/${seminarId}/payment-result?success=true`,
        failUrl: `${window.location.origin}/member/seminars/${seminarId}/payment-result?fail=true`,
      });
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error.code === "USER_CANCEL") {
        setError("결제가 취소되었습니다.");
      } else {
        setError(error.message || "결제 중 오류가 발생했습니다.");
      }
      setIsLoading(false);
    }
  };

  if (error && !isReady) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">결제 수단 선택</h3>
        <p className="text-sm text-muted-foreground mb-4">
          결제 금액: <span className="font-bold text-gold-600">{formatCurrency(amount)}</span>
        </p>

        {!isReady ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
            <span className="ml-2 text-sm text-muted-foreground">결제 모듈 로딩 중...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {METHODS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedMethod(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  selectedMethod === value
                    ? "border-navy-500 bg-navy-50 text-navy-700"
                    : "border-input hover:border-navy-300 text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="button"
        onClick={handlePayment}
        disabled={!isReady || isLoading}
        className="w-full py-3 rounded-lg bg-gold-500 text-navy-900 font-medium text-sm hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            결제 처리 중...
          </>
        ) : (
          `${formatCurrency(amount)} 결제하기`
        )}
      </button>
    </div>
  );
}
