"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Loader2, User, ChevronRight, AlertCircle, Building2, Copy, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { useMyRegistrations, useCancelRegistration } from "@/hooks/use-registrations";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { getCancellationRules } from "@/lib/cancellation-rules";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import {
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
} from "@/constants/member-tiers";
import { PendingSurveysCard } from "@/components/surveys/pending-surveys-card";
import type { Registration } from "@/types";

const ACTIVE_STATUSES = ["PENDING", "PAID", "PROMOTED", "WAITLISTED"];

function parseCancellationInfo(startAt: string) {
  return getCancellationRules(startAt);
}

export default function MyPage() {
  const { data: registrations, isLoading, error } = useMyRegistrations();
  const { toast } = useToast();

  const [cancelTarget, setCancelTarget] = useState<Registration | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cancelMutation = useCancelRegistration(cancelTarget?.seminarId ?? "");

  const activeRegs = registrations?.filter((r) =>
    ACTIVE_STATUSES.includes(r.status),
  );
  const pastRegs = registrations?.filter(
    (r) => !ACTIVE_STATUSES.includes(r.status),
  );

  const handleCancelClick = (reg: Registration) => {
    setCancelTarget(reg);
    setDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    cancelMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast({ title: data.message });
        setDialogOpen(false);
        setCancelTarget(null);
      },
      onError: (err) => {
        toast({ title: err.message, variant: "destructive" });
      },
    });
  };

  const cancellationInfo = cancelTarget?.seminar?.startAt
    ? parseCancellationInfo(cancelTarget.seminar.startAt)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <Link
          href="/my/profile"
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <User className="h-4 w-4" />
          내 프로필
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Tabs defaultValue="registrations">
        <TabsList>
          <TabsTrigger value="registrations">신청 내역</TabsTrigger>
          <TabsTrigger value="attendance">출석 이력</TabsTrigger>
          <TabsTrigger value="surveys">설문</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 py-8 text-center">
              신청 내역을 불러오는데 실패했습니다.
            </p>
          ) : !registrations || registrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                신청한 세미나가 없습니다.
              </p>
              <Link
                href="/"
                className="text-sm text-navy-500 hover:underline"
              >
                세미나 둘러보기
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 활성 신청 */}
              {activeRegs && activeRegs.length > 0 && (
                <section>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    활성 신청 ({activeRegs.length}건)
                  </h2>
                  <div className="space-y-3">
                    {activeRegs.map((reg) => (
                      <RegistrationCard
                        key={reg.id}
                        registration={reg}
                        onCancel={handleCancelClick}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 과거 내역 */}
              {pastRegs && pastRegs.length > 0 && (
                <section>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    지난 내역 ({pastRegs.length}건)
                  </h2>
                  <div className="space-y-3">
                    {pastRegs.map((reg) => (
                      <RegistrationCard
                        key={reg.id}
                        registration={reg}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <p className="text-muted-foreground text-center py-12">
            출석 이력 기능은 준비 중입니다.
          </p>
        </TabsContent>

        <TabsContent value="surveys" className="mt-6">
          <PendingSurveysCard />
        </TabsContent>
      </Tabs>

      {/* 취소 확인 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>신청 취소</DialogTitle>
            <DialogDescription>
              {cancelTarget?.seminar?.title} 세미나 신청을 취소하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          {cancellationInfo && (
            <div className="text-sm space-y-2">
              {cancelTarget?.status === "WAITLISTED" ? (
                <p className="text-muted-foreground">
                  대기 신청은 위약금 없이 즉시 취소됩니다.
                </p>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    {cancellationInfo.reason}
                  </p>
                  {cancellationInfo.penaltyPercent > 0 && (
                    <p className="text-red-500 font-medium">
                      위약금: {cancellationInfo.penaltyPercent}% (환불:{" "}
                      {cancellationInfo.refundPercent}%)
                    </p>
                  )}
                  {!cancellationInfo.canCancel && (
                    <p className="text-red-500 font-medium">
                      현재 취소가 불가능합니다.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              닫기
            </button>
            {(cancelTarget?.status === "WAITLISTED" ||
              cancellationInfo?.canCancel) && (
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "취소 확인"
                )}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Registration Card ─────────────────────────────

function RegistrationCard({
  registration,
  onCancel,
}: {
  registration: Registration;
  onCancel?: (reg: Registration) => void;
}) {
  const seminar = registration.seminar;
  const canCancel = ACTIVE_STATUSES.includes(registration.status);
  const isPendingPayment =
    registration.status === "PENDING" &&
    registration.payment?.status === "PENDING";

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("110-210-910967");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* 타입 + 상태 배지 */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {seminar && (
              <span className="inline-flex items-center rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-600">
                {SEMINAR_TYPE_LABELS[seminar.type]}
              </span>
            )}
            <StatusBadge
              status={registration.status}
              label={REGISTRATION_STATUS_LABELS[registration.status] || registration.status}
              colorMap={REGISTRATION_STATUS_COLORS}
            />
          </div>

          {/* 세미나 제목 */}
          <h3 className="font-bold text-foreground mb-2 truncate">
            {seminar ? (
              <Link
                href={`/seminars/${seminar.id}`}
                className="hover:underline"
              >
                {seminar.title}
              </Link>
            ) : (
              "세미나 정보 없음"
            )}
          </h3>

          {/* 일시/장소 */}
          {seminar && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDateTime(seminar.startAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {seminar.onlineLink ? "온라인" : seminar.venue || "장소 미정"}
                </span>
              </div>
            </div>
          )}

          {/* 대기 순번 */}
          {registration.status === "WAITLISTED" &&
            registration.waitlistNumber && (
              <p className="mt-2 text-sm text-blue-600">
                대기 순번: {registration.waitlistNumber}번
              </p>
            )}
        </div>

        {/* 오른쪽: 가격 + 취소 */}
        <div className="text-right shrink-0">
          <p className="font-bold text-foreground">
            {registration.finalPrice === 0
              ? "무료"
              : formatCurrency(registration.finalPrice)}
          </p>
          {registration.discountAmount > 0 && (
            <p className="text-xs text-muted-foreground line-through">
              {formatCurrency(registration.originalPrice)}
            </p>
          )}

          {canCancel && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(registration)}
              className="mt-3 text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
            >
              취소하기
            </button>
          )}
        </div>
      </div>

      {/* 입금 대기 알럿 */}
      {isPendingPayment && (
        <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              입금이 확인되지 않았습니다. 아래 계좌로 입금해주세요.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-yellow-700 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                입금 계좌
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-yellow-900">신한은행 110-210-910967 (박지희)</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center text-xs text-yellow-700 hover:text-yellow-900 transition-colors"
                >
                  {copied ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-700">입금 금액</span>
              <span className="font-bold text-yellow-900">{formatCurrency(registration.finalPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-700">입금자명</span>
              <span className="font-bold text-yellow-900">
                {registration.payment?.depositorName || "—"}
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              반드시 위 입금자명으로 송금해주세요. 입금 후 자동으로 확인됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
