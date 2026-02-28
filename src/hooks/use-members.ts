"use client";

import { useQuery } from "@tanstack/react-query";
import type { Member } from "@/types";

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("회원 목록을 불러올 수 없습니다");
      return res.json();
    },
  });
}
