"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { useConfirmPayment } from "@/hooks/use-payments";

export default function PaymentResultPage({
  params,
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const confirmMutation = useConfirmPayment();
  const [status, setStatus] = useState<"loading" | "success" | "fail">("loading");
  const [message, setMessage] = useState("");

  const isSuccess = searchParams.get("success") === "true";
  const isFail = searchParams.get("fail") === "true";
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (isSuccess && paymentKey && orderId && amount) {
      // 결제 확인 API 호출
      confirmMutation.mutate(
        {
          paymentKey,
          orderId,
          amount: Number(amount),
        },
        {
          onSuccess: () => {
            setStatus("success");
            setMessage("결제가 완료되었습니다.");
          },
          onError: (err) => {
            setStatus("fail");
            setMessage(err.message || "결제 확인에 실패했습니다.");
          },
        },
      );
    } else if (isFail) {
      setStatus("fail");
      const errorCode = searchParams.get("code");
      const errorMessage = searchParams.get("message");
      setMessage(
        errorMessage || (errorCode === "USER_CANCEL" ? "결제가 취소되었습니다." : "결제에 실패했습니다."),
      );
    } else {
      setStatus("fail");
      setMessage("잘못된 접근입니다.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-navy-400 mb-4" />
        <p className="text-lg font-medium text-foreground">결제 확인 중...</p>
        <p className="text-sm text-muted-foreground mt-2">
          잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">결제 완료</h1>
        <p className="text-muted-foreground mb-8">{message}</p>
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

  // fail
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <XCircle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-foreground mb-2">결제 실패</h1>
      <p className="text-muted-foreground mb-8">{message}</p>
      <div className="flex gap-3">
        <Link
          href={`/seminars/${params.id}/register`}
          className="inline-flex items-center justify-center rounded-lg bg-gold-500 text-navy-900 font-medium text-sm px-6 py-3 hover:bg-gold-400 transition-colors gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          다시 시도하기
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
