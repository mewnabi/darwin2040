"use client";

import Link from "next/link";
import { ClipboardList, ChevronRight, Loader2 } from "lucide-react";
import { useMyPendingSurveys } from "@/hooks/use-surveys";

export function PendingSurveysCard() {
  const { data: surveys, isLoading } = useMyPendingSurveys();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!surveys || surveys.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">작성할 설문이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {surveys.map((survey) => (
        <Link
          key={survey.surveyId}
          href={`/member/seminars/${survey.seminarId}/survey`}
          className="flex items-center justify-between rounded-xl border bg-card p-5 hover:border-navy-300 transition-colors group"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-700">
                미작성
              </span>
            </div>
            <h3 className="font-bold text-foreground truncate">
              {survey.seminarTitle}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {survey.surveyTitle} ·{" "}
              {new Date(survey.seminarDate).toLocaleDateString("ko-KR")}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-navy-500 transition-colors shrink-0 ml-3" />
        </Link>
      ))}
    </div>
  );
}
