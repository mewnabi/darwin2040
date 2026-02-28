"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Copy, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentFormProps {
  amount: number;
  orderName: string;
  customerName?: string;
  seminarId: string;
}

const BANK_INFO = {
  bank: "신한은행",
  account: "110-210-910967",
  holder: "박지희",
} as const;

export function PaymentForm({
  amount,
  orderName,
  customerName,
  seminarId,
}: PaymentFormProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_INFO.account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 시 무시
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-navy-500" />
          <h3 className="text-lg font-bold text-foreground">무통장입금 안내</h3>
        </div>

        <div className="space-y-3">
          {/* 은행 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">입금 은행</span>
            <span className="font-medium text-foreground">{BANK_INFO.bank}</span>
          </div>

          {/* 계좌번호 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">계좌번호</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{BANK_INFO.account}</span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="inline-flex items-center gap-1 text-xs text-navy-500 hover:text-navy-700 transition-colors"
              >
                {copied ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>

          {/* 예금주 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">예금주</span>
            <span className="font-medium text-foreground">{BANK_INFO.holder}</span>
          </div>

          <div className="border-t my-3" />

          {/* 입금 금액 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">입금 금액</span>
            <span className="text-lg font-bold text-gold-600">{formatCurrency(amount)}</span>
          </div>

          {/* 입금자명 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">입금자명</span>
            <span className="font-medium text-foreground">{customerName || "-"}</span>
          </div>
        </div>

        {/* 세미나명 */}
        <div className="mt-4 p-3 rounded-lg bg-navy-50 text-sm text-navy-700">
          <span className="font-medium">세미나:</span> {orderName}
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="rounded-xl border border-gold-200 bg-gold-50 p-4">
        <p className="text-sm text-gold-800 font-medium mb-1">
          입금 후 자동으로 확인됩니다
        </p>
        <p className="text-xs text-gold-700">
          위 계좌로 정확한 금액을 입금해주세요. 입금자명이 회원 이름과 일치해야 자동 확인이 가능합니다.
          입금 확인까지 몇 분 소요될 수 있습니다.
        </p>
      </div>

      {/* 확인 버튼 */}
      <button
        type="button"
        onClick={() => router.push(`/member/seminars/${seminarId}/payment-result`)}
        className="w-full py-3 rounded-lg bg-gold-500 text-navy-900 font-medium text-sm hover:bg-gold-400 transition-colors"
      >
        입금 안내 확인했습니다
      </button>
    </div>
  );
}
