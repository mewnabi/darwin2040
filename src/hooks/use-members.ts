"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MemberWithCounts, MemberDetail, MemberFilters, MemberUpdateData } from "@/types";

export function useMembers(params?: MemberFilters) {
  return useQuery<MemberWithCounts[]>({
    queryKey: ["members", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.tier) searchParams.set("tier", params.tier);
      if (params?.role) searchParams.set("role", params.role);
      const res = await fetch(`/api/members?${searchParams}`);
      if (!res.ok) throw new Error("회원 목록을 불러올 수 없습니다");
      return res.json();
    },
  });
}

export function useMember(id: string) {
  return useQuery<MemberDetail>({
    queryKey: ["members", id],
    queryFn: async () => {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error("회원 정보를 불러올 수 없습니다");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MemberUpdateData) => {
      const res = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "회원 정보 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
  });
}
