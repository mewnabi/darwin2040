"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { StarRating } from "./star-rating";
import { NpsInput } from "./nps-input";
import { SURVEY_RATING_LABELS, SURVEY_RATING_KEYS } from "@/constants/survey-labels";
import type { SurveyFormData } from "@/types";

interface SurveyFormProps {
  onSubmit: (data: SurveyFormData) => void;
  isSubmitting?: boolean;
}

export function SurveyForm({ onSubmit, isSubmitting }: SurveyFormProps) {
  const [ratings, setRatings] = useState({
    overall: 0,
    content: 0,
    networking: 0,
    applicability: 0,
  });
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [freeComment, setFreeComment] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    for (const key of SURVEY_RATING_KEYS) {
      if (ratings[key] === 0) {
        newErrors.push(`${SURVEY_RATING_LABELS[key]}을(를) 선택해주세요`);
      }
    }
    if (npsScore === null) {
      newErrors.push("추천 점수(NPS)를 선택해주세요");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    onSubmit({
      overallRating: ratings.overall,
      contentRating: ratings.content,
      networkingRating: ratings.networking,
      applicabilityRating: ratings.applicability,
      npsScore: npsScore!,
      freeComment: freeComment.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {SURVEY_RATING_KEYS.map((key) => (
        <div key={key}>
          <label className="block text-sm font-medium mb-2">
            {SURVEY_RATING_LABELS[key]}
          </label>
          <StarRating
            value={ratings[key]}
            onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
            size="lg"
          />
        </div>
      ))}

      <div>
        <label className="block text-sm font-medium mb-2">
          이 세미나를 동료에게 추천하시겠습니까? (NPS)
        </label>
        <NpsInput value={npsScore} onChange={setNpsScore} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          자유 의견 (선택사항)
        </label>
        <textarea
          value={freeComment}
          onChange={(e) => setFreeComment(e.target.value)}
          placeholder="세미나에 대한 의견이나 개선 사항을 자유롭게 작성해주세요"
          className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-navy-300 resize-y"
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {freeComment.length}/2000
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center rounded-lg bg-navy-500 text-white h-12 px-6 font-medium hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            제출 중...
          </>
        ) : (
          "설문 제출"
        )}
      </button>
    </form>
  );
}
