"use client";

import { useQuery } from "@tanstack/react-query";
import type { SubsidyReport } from "@/types";

interface ReportParams {
  from: string;
  to: string;
}

export function useSubsidyReport(params: ReportParams | null) {
  return useQuery<SubsidyReport>({
    queryKey: ["subsidy-report", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.from) searchParams.set("from", params.from);
      if (params?.to) searchParams.set("to", params.to);
      const res = await fetch(`/api/reports/subsidy?${searchParams}`);
      if (!res.ok) throw new Error("보고서를 불러올 수 없습니다");
      return res.json();
    },
    enabled: !!params?.from && !!params?.to,
  });
}
