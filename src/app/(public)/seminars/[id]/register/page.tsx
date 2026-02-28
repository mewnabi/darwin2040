"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Tag, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { useSeminar } from "@/hooks/use-seminars";
import { useRegisterSeminar, usePricePreview } from "@/hooks/use-registrations";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import { PaymentForm } from "@/components/payments/payment-form";
import type { PricePreview, Registration, Payment } from "@/types";

export default function SeminarRegisterPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: seminar, isLoading: seminarLoading } = useSeminar(params.id);
  const registerMutation = useRegisterSeminar(params.id);
  const previewMutation = usePricePreview(params.id);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [preview, setPreview] = useState<PricePreview | null>(null);

  // Step 2: 결제 단계 (유료 세미나에서 신청 후)
  const [paymentStep, setPaymentStep] = useState(false);
  const [registrationData, setRegistrationData] = useState<
    (Registration & { payment?: Payment | null }) | null
  >(null);

  // 미인증 시 로그인 페이지로
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?callbackUrl=/seminars/${params.id}/register`);
    }
  }, [authLoading, isAuthenticated, router, params.id]);

  // 세미나 로드 시 자동 가격 프리뷰
  useEffect(() => {
    if (seminar && isAuthenticated) {
      previewMutation.mutate(undefined, {
        onSuccess: (data) => setPreview(data),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seminar?.id, isAuthenticated]);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    previewMutation.mutate(
      { promotionCode: promoCode.trim() },
      {
        onSuccess: (data) => {
          setPreview(data);
          setPromoApplied(true);
          toast({ title: "프로모션 코드가 적용되었습니다." });
        },
        onError: (err) => {
          toast({ title: err.message, variant: "destructive" });
          setPromoApplied(false);
        },
      },
    );
  };

  const handleRemovePromo = () => {
    setPromoCode("");
    setPromoApplied(false);
    previewMutation.mutate(undefined, {
      onSuccess: (data) => setPreview(data),
    });
  };

  const handleRegister = () => {
    registerMutation.mutate(
      { promotionCode: promoApplied ? promoCode.trim() : undefined },
      {
        onSuccess: (data) => {
          const reg = data.registration;
          // 무료 세미나 또는 대기자: 바로 마이페이지로
          if (reg.finalPrice === 0 || reg.status === "WAITLISTED") {
            toast({ title: data.message });
            router.push("/my");
            return;
          }
          // 유료 세미나: 결제 단계로 전환
          if (reg.payment?.orderId) {
            setRegistrationData(reg);
            setPaymentStep(true);
          } else {
            toast({ title: data.message });
            router.push("/my");
          }
        },
        onError: (err) => {
          toast({ title: err.message, variant: "destructive" });
        },
      },
    );
  };

  if (authLoading || seminarLoading) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <div className="h-6 w-32 bg-muted rounded mb-6" />
        <CardSkeleton />
        <div className="mt-6">
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          세미나를 찾을 수 없습니다.
        </p>
        <Link
          href="/"
          className="text-sm text-navy-500 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> 세미나 목록
        </Link>
      </div>
    );
  }

  if (seminar.status !== "PUBLISHED") {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          현재 신청 가능한 세미나가 아닙니다.
        </p>
        <Link
          href={`/seminars/${seminar.id}`}
          className="text-sm text-navy-500 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> 세미나 상세로 돌아가기
        </Link>
      </div>
    );
  }

  // Step 2: 결제 폼 표시
  if (paymentStep && registrationData?.payment) {
    return (
      <div className="container py-8 max-w-2xl mx-auto">
        <nav className="mb-6">
          <button
            onClick={() => setPaymentStep(false)}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> 신청 정보로 돌아가기
          </button>
        </nav>

        <h1 className="text-2xl font-bold text-foreground mb-6">결제하기</h1>

        {/* 세미나 요약 */}
        <div className="rounded-xl border bg-card p-4 mb-6">
          <h2 className="font-bold text-foreground">{seminar.title}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(seminar.startAt)}</span>
          </div>
        </div>

        <PaymentForm
          amount={registrationData.payment.amount}
          orderName={seminar.title}
          customerName={user?.name || undefined}
          seminarId={seminar.id}
          orderId={registrationData.payment.orderId || undefined}
        />
      </div>
    );
  }

  // Step 1: 신청 정보
  return (
    <div className="container py-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href={`/seminars/${seminar.id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 세미나 상세
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-foreground mb-6">세미나 신청</h1>

      {/* 세미나 요약 카드 */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-600">
            {SEMINAR_TYPE_LABELS[seminar.type]}
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-3">
          {seminar.title}
        </h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-navy-400" />
            <span>{formatDateTime(seminar.startAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-navy-400" />
            <span>
              {seminar.onlineLink
                ? "온라인"
                : seminar.venue || "장소 미정"}
            </span>
          </div>
        </div>
      </div>

      {/* 가격 명세 */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <h3 className="text-lg font-bold text-foreground mb-4">가격 상세</h3>

        {previewMutation.isPending && !preview ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
          </div>
        ) : preview ? (
          <div className="space-y-3">
            {/* 원가 */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">기본 참가비</span>
              <span className="text-foreground">
                {preview.originalPrice === 0
                  ? "무료"
                  : formatCurrency(preview.originalPrice)}
              </span>
            </div>

            {/* 할인 내역 */}
            {preview.discounts.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {d.label} ({d.rate}%)
                </span>
                <span className="text-red-500">
                  -{formatCurrency(d.amount)}
                </span>
              </div>
            ))}

            {/* 구분선 */}
            {preview.discounts.length > 0 && (
              <div className="border-t pt-3" />
            )}

            {/* 최종가 */}
            <div className="flex justify-between">
              <span className="font-bold text-foreground">최종 결제금액</span>
              <span className="text-xl font-bold text-gold-600">
                {preview.finalPrice === 0
                  ? "무료"
                  : formatCurrency(preview.finalPrice)}
              </span>
            </div>

            {/* 대기 안내 */}
            {preview.isWaitlisted && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      정원이 초과되었습니다
                    </p>
                    <p className="text-yellow-700 mt-1">
                      현재 {preview.currentRegistrations}/{preview.maxCapacity}명
                      신청 완료. 대기자로 등록되며, 자리가 생기면 자동 승격됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 프로모션 코드 */}
      {seminar.basePrice > 0 && (
        <div className="rounded-xl border bg-card p-6 mb-6">
          <h3 className="text-sm font-bold text-foreground mb-3">
            프로모션 코드
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="프로모션 코드 입력"
              disabled={promoApplied}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {promoApplied ? (
              <button
                type="button"
                onClick={handleRemovePromo}
                className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                제거
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || previewMutation.isPending}
                className="shrink-0 inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 bg-navy-500 text-white hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "적용"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 신청 버튼 */}
      <button
        type="button"
        onClick={handleRegister}
        disabled={registerMutation.isPending}
        className="w-full py-3 rounded-lg bg-gold-500 text-navy-900 font-medium text-sm hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            신청 처리 중...
          </>
        ) : preview?.isWaitlisted ? (
          "대기 신청하기"
        ) : preview && preview.finalPrice > 0 ? (
          "신청 후 결제하기"
        ) : (
          "신청 완료"
        )}
      </button>

      {registerMutation.isError && (
        <p className="mt-3 text-sm text-red-500 text-center">
          {registerMutation.error.message}
        </p>
      )}
    </div>
  );
}
