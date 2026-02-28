"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";
import { PaymentStatusBadge } from "@/components/payments/payment-status";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  REGISTRATION_STATUS_LABELS,
  MEMBER_TIER_LABELS,
} from "@/constants/member-tiers";

interface RegistrationData {
  seminar: {
    id: string;
    title: string;
    startAt: string;
    maxCapacity: number;
  };
  registrations: Array<{
    id: string;
    status: string;
    waitlistNumber: number | null;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    promotionCode: string | null;
    registeredAt: string;
    cancelledAt: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      tier: string;
    };
    payment: {
      id: string;
      orderId: string | null;
      depositorName: string | null;
      amount: number;
      status: string;
      method: string | null;
      paidAt: string | null;
      refundAmount: number;
      refundedAt: string | null;
    } | null;
  }>;
  stats: {
    total: number;
    pending: number;
    paid: number;
    waitlisted: number;
    promoted: number;
    cancelled: number;
    refunded: number;
    noShow: number;
  };
}

export default function RegistrationsPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RegistrationData>({
    queryKey: ["seminar-registrations", params.id, statusFilter],
    queryFn: async () => {
      const qs = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/seminars/${params.id}/registrations${qs}`);
      if (!res.ok) throw new Error("신청자 목록을 불러올 수 없습니다.");
      return res.json();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch("/api/payments/confirm-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "입금 확인에 실패했습니다.");
      return json;
    },
    onSuccess: (data) => {
      toast({ title: data.message });
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ["seminar-registrations"] });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
      setConfirmingId(null);
    },
  });

  const handleConfirm = (paymentId: string) => {
    setConfirmingId(paymentId);
    confirmMutation.mutate(paymentId);
  };

  const statCards = data
    ? [
        { label: "전체", value: data.stats.total, icon: Users, color: "text-foreground" },
        { label: "입금 대기", value: data.stats.pending, icon: Clock, color: "text-yellow-600" },
        { label: "결제 완료", value: data.stats.paid, icon: CheckCircle, color: "text-green-600" },
        { label: "대기자", value: data.stats.waitlisted, icon: AlertTriangle, color: "text-blue-600" },
        { label: "취소/환불", value: data.stats.cancelled + data.stats.refunded, icon: XCircle, color: "text-red-600" },
      ]
    : [];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/admin/seminars/${params.id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" /> 세미나 상세
        </Link>
        <h1 className="text-2xl font-bold">신청자 관리</h1>
        {data?.seminar && (
          <p className="text-muted-foreground mt-1">
            {data.seminar.title} &middot; {formatDateTime(data.seminar.startAt)}
          </p>
        )}
      </div>

      {/* 통계 카드 */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <card.icon className={`h-5 w-5 ${card.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-40">
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(v) => setStatusFilter(v === "ALL" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 상태</SelectItem>
              {Object.entries(REGISTRATION_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data && (
          <p className="text-sm text-muted-foreground">
            정원: {data.stats.paid + data.stats.pending}/{data.seminar.maxCapacity}명
          </p>
        )}
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : !data?.registrations.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>신청자가 없습니다.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>회원</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>신청 상태</TableHead>
                <TableHead>주문번호</TableHead>
                <TableHead>입금자명</TableHead>
                <TableHead>결제 상태</TableHead>
                <TableHead className="text-right">결제 금액</TableHead>
                <TableHead>결제일시</TableHead>
                <TableHead>신청일시</TableHead>
                <TableHead>액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{reg.user.name}</p>
                      <p className="text-xs text-muted-foreground">{reg.user.email}</p>
                      {reg.user.phone && (
                        <p className="text-xs text-muted-foreground">{reg.user.phone}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium">
                      {MEMBER_TIER_LABELS[reg.user.tier] || reg.user.tier}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={reg.status}
                      label={REGISTRATION_STATUS_LABELS[reg.status] || reg.status}
                    />
                    {reg.waitlistNumber && (
                      <span className="text-xs text-muted-foreground block mt-1">
                        대기 #{reg.waitlistNumber}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {reg.payment?.orderId ? (
                      <span className="text-xs font-mono text-muted-foreground">
                        {reg.payment.orderId}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {reg.payment?.depositorName ? (
                      <span className="text-sm">{reg.payment.depositorName}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {reg.payment ? (
                      <div>
                        <PaymentStatusBadge status={reg.payment.status} />
                        {reg.payment.refundAmount > 0 && (
                          <span className="text-xs text-red-500 block mt-1">
                            환불: {formatCurrency(reg.payment.refundAmount)}
                          </span>
                        )}
                      </div>
                    ) : reg.finalPrice === 0 ? (
                      <span className="text-xs text-muted-foreground">무료</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="text-sm font-medium">
                        {reg.finalPrice === 0 ? "무료" : formatCurrency(reg.finalPrice)}
                      </p>
                      {reg.discountAmount > 0 && (
                        <p className="text-xs text-red-500">
                          -{formatCurrency(reg.discountAmount)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {reg.payment?.paidAt ? formatDateTime(reg.payment.paidAt) : "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(reg.registeredAt)}
                  </TableCell>
                  <TableCell>
                    {reg.payment && reg.payment.status === "PENDING" && (
                      <button
                        onClick={() => handleConfirm(reg.payment!.id)}
                        disabled={confirmingId === reg.payment.id}
                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-800 font-medium transition-colors disabled:opacity-50"
                      >
                        {confirmingId === reg.payment.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        입금 확인
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
