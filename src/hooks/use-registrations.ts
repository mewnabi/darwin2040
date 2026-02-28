"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Registration, PricePreview, RegisterResponse, CancelResponse } from "@/types";

export function useMyRegistrations() {
  return useQuery<Registration[]>({
    queryKey: ["my-registrations"],
    queryFn: async () => {
      const res = await fetch("/api/members/me/registrations");
      if (!res.ok) throw new Error("신청 내역을 불러올 수 없습니다");
      return res.json();
    },
  });
}

export function useRegisterSeminar(seminarId: string) {
  const queryClient = useQueryClient();
  return useMutation<RegisterResponse, Error, { promotionCode?: string }>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/seminars/${seminarId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "세미나 신청에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
    },
  });
}

export function useCancelRegistration(seminarId: string) {
  const queryClient = useQueryClient();
  return useMutation<CancelResponse, Error>({
    mutationFn: async () => {
      const res = await fetch(`/api/seminars/${seminarId}/register`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "취소에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
    },
  });
}

export function usePricePreview(seminarId: string) {
  const queryClient = useQueryClient();
  return useMutation<PricePreview, Error, { promotionCode?: string } | void>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/seminars/${seminarId}/price-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "가격 조회에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["price-preview", seminarId], data);
    },
  });
}
