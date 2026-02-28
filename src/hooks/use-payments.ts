"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  PaymentConfirmRequest,
  PaymentRefundRequest,
  PaymentWithDetails,
  PaymentSummary,
} from "@/types";

// ─── 결제 확인 ───────────────────────────────────

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message: string }, Error, PaymentConfirmRequest>({
    mutationFn: async (data) => {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "결제 확인에 실패했습니다.");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

// ─── 환불 ────────────────────────────────────────

export function useRefundPayment() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; message: string; refundAmount: number },
    Error,
    PaymentRefundRequest
  >({
    mutationFn: async (data) => {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "환불 처리에 실패했습니다.");
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-summary"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
  });
}

// ─── 결제 목록 (관리자) ──────────────────────────

interface PaymentsParams {
  status?: string;
  seminarId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

interface PaymentsResponse {
  payments: PaymentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function usePayments(params: PaymentsParams = {}) {
  const queryString = new URLSearchParams();
  if (params.status) queryString.set("status", params.status);
  if (params.seminarId) queryString.set("seminarId", params.seminarId);
  if (params.from) queryString.set("from", params.from);
  if (params.to) queryString.set("to", params.to);
  if (params.page) queryString.set("page", params.page.toString());
  if (params.limit) queryString.set("limit", params.limit.toString());

  return useQuery<PaymentsResponse>({
    queryKey: ["payments", params],
    queryFn: async () => {
      const res = await fetch(`/api/payments?${queryString.toString()}`);
      if (!res.ok) throw new Error("결제 목록을 불러올 수 없습니다.");
      return res.json();
    },
  });
}

// ─── 매출 요약 (관리자) ──────────────────────────

interface SummaryParams {
  period?: "daily" | "monthly";
  from?: string;
  to?: string;
}

interface SummaryResponse {
  summary: PaymentSummary[];
  totals: {
    totalAmount: number;
    totalCount: number;
    refundAmount: number;
    netAmount: number;
  };
}

export function usePaymentSummary(params: SummaryParams = {}) {
  const queryString = new URLSearchParams();
  if (params.period) queryString.set("period", params.period);
  if (params.from) queryString.set("from", params.from);
  if (params.to) queryString.set("to", params.to);

  return useQuery<SummaryResponse>({
    queryKey: ["payment-summary", params],
    queryFn: async () => {
      const res = await fetch(`/api/payments/summary?${queryString.toString()}`);
      if (!res.ok) throw new Error("매출 요약을 불러올 수 없습니다.");
      return res.json();
    },
  });
}
