"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SpeakerPortalData } from "@/types";

export function useSpeakerPortal(token: string) {
  return useQuery<SpeakerPortalData>({
    queryKey: ["speaker-portal", token],
    queryFn: async () => {
      const res = await fetch(`/api/speaker-portal/${token}`);
      if (res.status === 410) {
        throw new Error("토큰이 만료되었습니다. 운영팀에 문의해주세요.");
      }
      if (!res.ok) {
        throw new Error("포털 데이터를 불러올 수 없습니다");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });
}

export function useSavePortalStep(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      step,
      data,
    }: {
      step: number;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/speaker-portal/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "저장에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speaker-portal", token] });
    },
  });
}

export function useSubmitPortal(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/speaker-portal/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "제출에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["speaker-portal", token] });
    },
  });
}
