"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Speaker, SpeakerFormData, SpeakerContract } from "@/types";

interface SpeakerFilters {
  search?: string;
  status?: string;
  expertise?: string;
}

export function useSpeakers(params?: SpeakerFilters) {
  return useQuery<Speaker[]>({
    queryKey: ["speakers", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.status) searchParams.set("status", params.status);
      if (params?.expertise) searchParams.set("expertise", params.expertise);
      const res = await fetch(`/api/speakers?${searchParams}`);
      if (!res.ok) throw new Error("연사 목록을 불러올 수 없습니다");
      return res.json();
    },
  });
}

export function useSpeaker(id: string) {
  return useQuery<Speaker>({
    queryKey: ["speakers", id],
    queryFn: async () => {
      const res = await fetch(`/api/speakers/${id}`);
      if (!res.ok) throw new Error("연사를 찾을 수 없습니다");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateSpeaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SpeakerFormData) => {
      const res = await fetch("/api/speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "연사 등록에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers"] });
    },
  });
}

export function useUpdateSpeaker(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SpeakerFormData> & { status?: string; company?: Record<string, unknown> }) => {
      const res = await fetch(`/api/speakers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "연사 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers"] });
      queryClient.invalidateQueries({ queryKey: ["speakers", id] });
    },
  });
}

export function useRequestSpeakerInfo(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/speakers/${id}/request-info`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "정보 요청에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speakers", id] });
    },
  });
}

export function useSpeakerContracts(speakerId: string) {
  return useQuery<SpeakerContract[]>({
    queryKey: ["speakers", speakerId, "contracts"],
    queryFn: async () => {
      const res = await fetch(`/api/speakers/${speakerId}/contracts`);
      if (!res.ok) throw new Error("계약 목록을 불러올 수 없습니다");
      return res.json();
    },
    enabled: !!speakerId,
  });
}

export function useCreateContract(speakerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/speakers/${speakerId}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "계약 생성에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["speakers", speakerId, "contracts"],
      });
      queryClient.invalidateQueries({ queryKey: ["speakers", speakerId] });
    },
  });
}

export function useUpdateContract(speakerId: string, contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(
        `/api/speakers/${speakerId}/contracts/${contractId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "계약 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["speakers", speakerId, "contracts"],
      });
      queryClient.invalidateQueries({ queryKey: ["speakers", speakerId] });
    },
  });
}

export function useDeleteContract(speakerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: string) => {
      const res = await fetch(
        `/api/speakers/${speakerId}/contracts/${contractId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "계약 삭제에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["speakers", speakerId, "contracts"],
      });
      queryClient.invalidateQueries({ queryKey: ["speakers", speakerId] });
    },
  });
}
