"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Seminar, SeminarFormData } from "@/types";

interface SeminarFilters {
  status?: string;
  type?: string;
  search?: string;
  from?: string;
  to?: string;
}

export function useSeminars(params?: SeminarFilters) {
  return useQuery<Seminar[]>({
    queryKey: ["seminars", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.type) searchParams.set("type", params.type);
      if (params?.search) searchParams.set("search", params.search);
      if (params?.from) searchParams.set("from", params.from);
      if (params?.to) searchParams.set("to", params.to);
      const res = await fetch(`/api/seminars?${searchParams}`);
      if (!res.ok) throw new Error("세미나 목록을 불러올 수 없습니다");
      return res.json();
    },
  });
}

export function useSeminar(id: string) {
  return useQuery<Seminar>({
    queryKey: ["seminars", id],
    queryFn: async () => {
      const res = await fetch(`/api/seminars/${id}`);
      if (!res.ok) throw new Error("세미나를 찾을 수 없습니다");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateSeminar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SeminarFormData) => {
      const res = await fetch("/api/seminars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "세미나 생성에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
    },
  });
}

export function useUpdateSeminar(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SeminarFormData>) => {
      const res = await fetch(`/api/seminars/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "세미나 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
      queryClient.invalidateQueries({ queryKey: ["seminars", id] });
    },
  });
}

export function useDeleteSeminar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/seminars/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "세미나 삭제에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seminars"] });
    },
  });
}
