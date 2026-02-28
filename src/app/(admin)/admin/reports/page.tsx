"use client";

import Link from "next/link";
import {
  FileBarChart,
  ClipboardList,
  TrendingUp,
  Users,
  ChevronRight,
} from "lucide-react";
import { useSurveys } from "@/hooks/use-surveys";

export default function AdminReportsPage() {
  const { data: surveys } = useSurveys();
  const totalResponses = surveys?.reduce(
    (sum, s) => sum + (s._count?.responses ?? 0),
    0,
  ) ?? 0;

  const reportCards = [
    {
      title: "보조금 보고서",
      description: "정부 보조금 프로그램 성과 보고서를 생성합니다.",
      href: "/admin/reports/subsidy",
      icon: FileBarChart,
      stats: "기간별 출석률, 만족도, 인구통계 집계",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">보고서 대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-navy-50 p-2.5">
              <ClipboardList className="h-5 w-5 text-navy-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 설문</p>
              <p className="text-2xl font-bold">{surveys?.length ?? 0}건</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gold-50 p-2.5">
              <Users className="h-5 w-5 text-gold-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">총 설문 응답</p>
              <p className="text-2xl font-bold">{totalResponses}건</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-50 p-2.5">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">활성 설문</p>
              <p className="text-2xl font-bold">
                {surveys?.filter((s) => s.isActive).length ?? 0}건
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 보고서 카드 */}
      <h2 className="text-lg font-semibold mb-4">보고서 생성</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center justify-between rounded-xl border bg-card p-6 hover:border-navy-300 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-navy-50 p-3">
                <card.icon className="h-6 w-6 text-navy-500" />
              </div>
              <div>
                <h3 className="font-semibold">{card.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {card.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {card.stats}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-navy-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
