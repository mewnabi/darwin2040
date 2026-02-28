"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { SurveyForm } from "@/components/surveys/survey-form";
import { useSeminar } from "@/hooks/use-seminars";
import { useSubmitSurvey } from "@/hooks/use-surveys";
import { useToast } from "@/hooks/use-toast";
import type { SurveyFormData, PendingSurvey } from "@/types";

function useSurveyForSeminar(seminarId: string) {
  return useQuery<PendingSurvey | null>({
    queryKey: ["survey-for-seminar", seminarId],
    queryFn: async () => {
      const res = await fetch("/api/members/me/surveys");
      if (!res.ok) return null;
      const surveys: PendingSurvey[] = await res.json();
      return surveys.find((s) => s.seminarId === seminarId) ?? null;
    },
    enabled: !!seminarId,
  });
}

export default function MemberSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const seminarId = params.id as string;
  const [submitted, setSubmitted] = useState(false);

  const { data: seminar, isLoading: seminarLoading } = useSeminar(seminarId);
  const { data: pendingSurvey, isLoading: surveyLoading } = useSurveyForSeminar(seminarId);

  const surveyId = pendingSurvey?.surveyId || "";
  const submitMutation = useSubmitSurvey(surveyId);

  const handleSubmit = (data: SurveyFormData) => {
    if (!surveyId) {
      toast({ title: "설문을 찾을 수 없습니다", variant: "destructive" });
      return;
    }
    submitMutation.mutate(data, {
      onSuccess: () => {
        setSubmitted(true);
        toast({ title: "설문이 제출되었습니다. 감사합니다!" });
      },
      onError: (err) => {
        toast({ title: err.message, variant: "destructive" });
      },
    });
  };

  if (seminarLoading || surveyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (!pendingSurvey) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          이 세미나에 대한 설문이 없거나 이미 응답하셨습니다.
        </p>
        <Link href="/my" className="text-navy-500 hover:underline text-sm">
          마이페이지로 돌아가기
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">설문이 제출되었습니다</h1>
        <p className="text-muted-foreground mb-6">
          소중한 의견 감사합니다. 더 나은 세미나를 위해 노력하겠습니다.
        </p>
        <button
          onClick={() => router.push("/my")}
          className="inline-flex items-center justify-center rounded-lg bg-navy-500 text-white h-10 px-6 font-medium hover:bg-navy-600 transition-colors"
        >
          마이페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/my"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        마이페이지
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{pendingSurvey.surveyTitle}</h1>
        {seminar && (
          <p className="text-muted-foreground mt-1">
            {seminar.title} ·{" "}
            {new Date(seminar.startAt).toLocaleDateString("ko-KR")}
          </p>
        )}
      </div>

      <SurveyForm
        onSubmit={handleSubmit}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
}
