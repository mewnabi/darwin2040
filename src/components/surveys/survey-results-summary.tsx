"use client";

import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SURVEY_RATING_LABELS, SURVEY_RATING_KEYS, NPS_LABELS } from "@/constants/survey-labels";
import type { SurveyStats } from "@/types";

interface SurveyResultsSummaryProps {
  stats: SurveyStats;
}

export function SurveyResultsSummary({ stats }: SurveyResultsSummaryProps) {
  const npsTotal = stats.nps.promoters + stats.nps.passives + stats.nps.detractors;

  return (
    <div className="space-y-8">
      {/* 평균 점수 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SURVEY_RATING_KEYS.map((key) => (
          <div
            key={key}
            className="rounded-xl border bg-card p-4 text-center"
          >
            <p className="text-xs text-muted-foreground mb-1">
              {SURVEY_RATING_LABELS[key]}
            </p>
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-gold-500 text-gold-500" />
              <span className="text-2xl font-bold">
                {stats.averages[key].toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
          </div>
        ))}
      </div>

      {/* 분포 바 */}
      <div className="space-y-4">
        <h3 className="font-semibold">점수 분포</h3>
        {SURVEY_RATING_KEYS.map((key) => (
          <div key={key}>
            <p className="text-sm font-medium mb-2">{SURVEY_RATING_LABELS[key]}</p>
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((score) => {
                const count = stats.distribution[key][score - 1];
                const pct =
                  stats.totalResponses > 0
                    ? (count / stats.totalResponses) * 100
                    : 0;
                return (
                  <div key={score} className="flex items-center gap-2 text-sm">
                    <span className="w-6 text-right text-muted-foreground">
                      {score}
                    </span>
                    <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-muted-foreground">
                      {count}명
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* NPS */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">NPS (Net Promoter Score)</h3>
        <div className="flex items-center justify-center mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              {stats.nps.score > 0 ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : stats.nps.score < 0 ? (
                <TrendingDown className="h-6 w-6 text-red-500" />
              ) : (
                <Minus className="h-6 w-6 text-yellow-500" />
              )}
              <span className="text-4xl font-bold">{stats.nps.score}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">NPS 점수</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {(["promoters", "passives", "detractors"] as const).map((type) => {
            const count = stats.nps[type];
            const pct = npsTotal > 0 ? Math.round((count / npsTotal) * 100) : 0;
            const colors = {
              promoters: "text-green-600",
              passives: "text-yellow-600",
              detractors: "text-red-600",
            };
            return (
              <div key={type}>
                <p className={`text-2xl font-bold ${colors[type]}`}>{pct}%</p>
                <p className="text-xs text-muted-foreground">
                  {NPS_LABELS[type]}
                </p>
                <p className="text-xs text-muted-foreground">{count}명</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 자유 의견 */}
      {stats.comments.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4">
            자유 의견 ({stats.comments.length}건)
          </h3>
          <div className="space-y-3">
            {stats.comments.map((c, i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <p className="text-sm">{c.comment}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{c.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
