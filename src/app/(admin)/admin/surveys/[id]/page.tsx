"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { useSurveyStats } from "@/hooks/use-surveys";
import { SurveyResultsSummary } from "@/components/surveys/survey-results-summary";

export default function AdminSurveyDetailPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const { data, isLoading, error } = useSurveyStats(surveyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">설문 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/surveys"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        설문 목록
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          {data.seminar && (
            <span>{data.seminar.title}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {data.stats.totalResponses}명 응답
          </span>
        </div>
      </div>

      {data.stats.totalResponses === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            아직 응답이 없습니다.
          </p>
        </div>
      ) : (
        <SurveyResultsSummary stats={data.stats} />
      )}
    </div>
  );
}
