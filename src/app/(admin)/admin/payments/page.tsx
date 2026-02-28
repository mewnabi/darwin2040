"use client";

import { useState } from "react";
import { CreditCard, TrendingDown, TrendingUp, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentStatusBadge } from "@/components/payments/payment-status";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { usePayments, usePaymentSummary, useRefundPayment } from "@/hooks/use-payments";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PAYMENT_STATUS_LABELS } from "@/constants/member-tiers";

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const refundMutation = useRefundPayment();

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 환불 다이얼로그
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    registrationId: string;
    paymentAmount: number;
    seminarTitle: string;
    userName: string;
  }>({
    open: false,
    registrationId: "",
    paymentAmount: 0,
    seminarTitle: "",
    userName: "",
  });
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundReason, setRefundReason] = useState("");

  // 매출 요약 탭
  const [summaryPeriod, setSummaryPeriod] = useState<"daily" | "monthly">("daily");

  // 데이터 조회
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments({
    status: statusFilter || undefined,
    from: dateFrom || undefined,
    to: dateTo || undefined,
    page,
    limit: 20,
  });

  const { data: summaryData, isLoading: summaryLoading } = usePaymentSummary({
    period: summaryPeriod,
  });

  const handleRefund = () => {
    if (!refundReason.trim()) {
      toast({ title: "환불 사유를 입력해주세요.", variant: "destructive" });
      return;
    }

    const cancelAmount =
      refundType === "partial"
        ? Math.floor(refundDialog.paymentAmount * 0.5)
        : undefined;

    refundMutation.mutate(
      {
        registrationId: refundDialog.registrationId,
        reason: refundReason,
        cancelAmount,
      },
      {
        onSuccess: (data) => {
          toast({ title: data.message });
          setRefundDialog({ ...refundDialog, open: false });
          setRefundReason("");
          setRefundType("full");
        },
        onError: (err) => {
          toast({ title: err.message, variant: "destructive" });
        },
      },
    );
  };

  const totals = summaryData?.totals;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">결제/정산 관리</h1>

      {/* 매출 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 결제액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals ? formatCurrency(totals.totalAmount) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals ? `${totals.totalCount}건` : "로딩 중..."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 환불액</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {totals ? formatCurrency(totals.refundAmount) : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totals ? formatCurrency(totals.netAmount) : "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 건수</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals ? totals.totalCount.toLocaleString() : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">결제 내역</TabsTrigger>
          <TabsTrigger value="summary">매출 분석</TabsTrigger>
        </TabsList>

        {/* 결제 내역 탭 */}
        <TabsContent value="payments" className="space-y-4">
          {/* 필터 */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-40">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                결제 상태
              </label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                시작일
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                종료일
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            {(statusFilter || dateFrom || dateTo) && (
              <button
                onClick={() => { setStatusFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                className="inline-flex items-center gap-1 h-10 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                초기화
              </button>
            )}
          </div>

          {/* 결제 목록 테이블 */}
          {paymentsLoading ? (
            <TableSkeleton rows={8} />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>주문번호</TableHead>
                      <TableHead>세미나</TableHead>
                      <TableHead>회원</TableHead>
                      <TableHead className="text-right">결제금액</TableHead>
                      <TableHead>결제수단</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>결제일시</TableHead>
                      <TableHead>액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsData?.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          결제 내역이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentsData?.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-xs">
                            {payment.tossOrderId || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {payment.registration.seminar.title}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{payment.registration.user.name}</p>
                              <p className="text-xs text-muted-foreground">{payment.registration.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.method || "-"}
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={payment.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.paidAt ? formatDateTime(payment.paidAt) : "-"}
                          </TableCell>
                          <TableCell>
                            {payment.status === "COMPLETED" && (
                              <button
                                onClick={() =>
                                  setRefundDialog({
                                    open: true,
                                    registrationId: payment.registrationId,
                                    paymentAmount: payment.amount,
                                    seminarTitle: payment.registration.seminar.title,
                                    userName: payment.registration.user.name,
                                  })
                                }
                                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                              >
                                환불
                              </button>
                            )}
                            {payment.refundAmount > 0 && (
                              <span className="text-xs text-muted-foreground block">
                                환불: {formatCurrency(payment.refundAmount)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* 페이지네이션 */}
              {paymentsData && paymentsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    전체 {paymentsData.pagination.total}건 중{" "}
                    {(page - 1) * 20 + 1}-{Math.min(page * 20, paymentsData.pagination.total)}건
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-accent transition-colors"
                    >
                      이전
                    </button>
                    <span className="px-3 py-1 text-sm">
                      {page} / {paymentsData.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(paymentsData.pagination.totalPages, p + 1))}
                      disabled={page === paymentsData.pagination.totalPages}
                      className="px-3 py-1 text-sm rounded border disabled:opacity-50 hover:bg-accent transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 매출 분석 탭 */}
        <TabsContent value="summary" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={summaryPeriod} onValueChange={(v) => setSummaryPeriod(v as "daily" | "monthly")}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">일별</SelectItem>
                <SelectItem value="monthly">월별</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {summaryLoading ? (
            <TableSkeleton rows={10} />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead className="text-right">결제 건수</TableHead>
                    <TableHead className="text-right">총 결제액</TableHead>
                    <TableHead className="text-right">환불액</TableHead>
                    <TableHead className="text-right">순매출</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!summaryData?.summary.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        매출 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaryData.summary.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell className="text-right">{row.totalCount}건</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell>
                        <TableCell className="text-right text-red-500">
                          {row.refundAmount > 0 ? formatCurrency(row.refundAmount) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(row.netAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 환불 다이얼로그 */}
      <Dialog open={refundDialog.open} onOpenChange={(open) => setRefundDialog({ ...refundDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 처리</DialogTitle>
            <DialogDescription>
              {refundDialog.userName}님의 &quot;{refundDialog.seminarTitle}&quot; 결제를 환불합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">결제 금액</label>
              <p className="text-lg font-bold">{formatCurrency(refundDialog.paymentAmount)}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">환불 유형</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    checked={refundType === "full"}
                    onChange={() => setRefundType("full")}
                    className="text-navy-500"
                  />
                  <span className="text-sm">
                    전액 환불 ({formatCurrency(refundDialog.paymentAmount)})
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    checked={refundType === "partial"}
                    onChange={() => setRefundType("partial")}
                    className="text-navy-500"
                  />
                  <span className="text-sm">
                    50% 환불 ({formatCurrency(Math.floor(refundDialog.paymentAmount * 0.5))})
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">환불 사유</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="환불 사유를 입력해주세요"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setRefundDialog({ ...refundDialog, open: false });
                setRefundReason("");
                setRefundType("full");
              }}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border border-input bg-background hover:bg-accent transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleRefund}
              disabled={refundMutation.isPending || !refundReason.trim()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors gap-2"
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "환불 처리"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
