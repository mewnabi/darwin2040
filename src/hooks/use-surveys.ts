"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Survey, SurveyFormData, PendingSurvey } from "@/types";

export function useSurveys() {
  return useQuery<Survey[]>({
    queryKey: ["surveys"],
    queryFn: async () => {
      const res = await fetch("/api/surveys");
      if (!res.ok) throw new Error("설문 목록을 불러올 수 없습니다");
      return res.json();
    },
  });
}

export function useSurveyStats(id: string) {
  return useQuery({
    queryKey: ["surveys", id],
    queryFn: async () => {
      const res = await fetch(`/api/surveys/${id}`);
      if (!res.ok) throw new Error("설문을 찾을 수 없습니다");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useMyPendingSurveys() {
  return useQuery<PendingSurvey[]>({
    queryKey: ["my-pending-surveys"],
    queryFn: async () => {
      const res = await fetch("/api/members/me/surveys");
      if (!res.ok) throw new Error("설문 목록을 불러올 수 없습니다");
      return res.json();
    },
  });
}

export function useSubmitSurvey(surveyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: SurveyFormData) => {
      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "설문 제출에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-surveys"] });
    },
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { seminarId: string; title?: string }) => {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "설문 생성에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useToggleSurvey(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await fetch(`/api/surveys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "설문 상태 변경에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({ queryKey: ["surveys", id] });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/surveys/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "설문 삭제에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}
