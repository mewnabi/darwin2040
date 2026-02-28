"use client";

import Link from "next/link";
import { Clock, Building2 } from "lucide-react";

export default function PaymentResultPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="rounded-full bg-gold-100 p-4 mb-4">
        <Clock className="h-12 w-12 text-gold-600" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        무통장입금 신청 완료
      </h1>
      <p className="text-muted-foreground text-center mb-6 max-w-sm">
        입금이 확인되면 자동으로 결제 완료 처리됩니다.
      </p>

      {/* 입금 정보 요약 */}
      <div className="w-full max-w-sm rounded-xl border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-navy-500" />
          <span className="text-sm font-bold text-foreground">입금 계좌 정보</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">은행</span>
            <span className="font-medium">신한은행</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">계좌번호</span>
            <span className="font-medium">110-210-910967</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">예금주</span>
            <span className="font-medium">박지희</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mb-8 max-w-sm">
        마이페이지에서 입금 확인 상태를 확인하실 수 있습니다.
      </p>

      <div className="flex gap-3">
        <Link
          href="/my"
          className="inline-flex items-center justify-center rounded-lg bg-gold-500 text-navy-900 font-medium text-sm px-6 py-3 hover:bg-gold-400 transition-colors"
        >
          마이페이지로 이동
        </Link>
        <Link
          href={`/seminars/${params.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm font-medium px-6 py-3 hover:bg-accent transition-colors"
        >
          세미나 상세보기
        </Link>
      </div>
    </div>
  );
}
