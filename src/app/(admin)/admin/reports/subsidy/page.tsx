"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Star, Users, CalendarCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PeriodSelector } from "@/components/reports/period-selector";
import { TemplateSelector } from "@/components/reports/template-selector";
import { AttendanceTrendChart } from "@/components/reports/charts/attendance-trend-chart";
import { SatisfactionChart } from "@/components/reports/charts/satisfaction-chart";
import { DemographicsChart } from "@/components/reports/charts/demographics-chart";
import { ReportExport } from "@/components/reports/report-export";
import { useSubsidyReport } from "@/hooks/use-reports";
import { SURVEY_RATING_LABELS } from "@/constants/survey-labels";
import type { ReportTemplate } from "@/types";

export default function SubsidyReportPage() {
  const [period, setPeriod] = useState<{ from: string; to: string } | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);

  const { data: report, isLoading, error } = useSubsidyReport(period);

  const handlePeriodSelect = (from: string, to: string) => {
    setPeriod({ from, to });
  };

  return (
    <div className="print:p-8">
      <Link
        href="/admin/reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 print:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        보고서 목록
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">보조금 보고서</h1>
        {report && <ReportExport report={report} />}
      </div>

      {/* 기간 선택 */}
      <section className="mb-8 print:hidden">
        <h2 className="text-lg font-semibold mb-3">보고 기간</h2>
        <PeriodSelector onSelect={handlePeriodSelect} />
      </section>

      {/* 템플릿 선택 */}
      <section className="mb-8 print:hidden">
        <h2 className="text-lg font-semibold mb-3">보고서 템플릿</h2>
        <TemplateSelector selected={template} onSelect={setTemplate} />
      </section>

      {/* 결과 */}
      {!period ? (
        <div className="text-center py-20 text-muted-foreground">
          기간을 선택하면 보고서가 생성됩니다.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
        </div>
      ) : error || !report ? (
        <div className="text-center py-20 text-red-500">
          보고서를 불러올 수 없습니다.
        </div>
      ) : (
        <div className="space-y-10">
          {/* 인쇄 전용 헤더 */}
          <div className="hidden print:block">
            <p className="text-sm text-muted-foreground">
              보고 기간: {report.period.from} ~ {report.period.to}
            </p>
          </div>

          {/* 프로그램 통계 요약 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">프로그램 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="총 세미나"
                value={`${report.programStats.totalSeminars}회`}
                icon={CalendarCheck}
              />
              <StatCard
                label="총 등록"
                value={`${report.programStats.totalRegistrations}명`}
                icon={Users}
              />
              <StatCard
                label="총 참석"
                value={`${report.programStats.totalAttendees}명`}
                icon={Users}
              />
              <StatCard
                label="평균 출석률"
                value={`${report.programStats.averageAttendanceRate}%`}
                icon={TrendingUp}
              />
            </div>

            {/* 유형별 세미나 수 */}
            {Object.keys(report.programStats.seminarsByType).length > 0 && (
              <div className="mt-4 rounded-xl border bg-card p-4">
                <h3 className="text-sm font-medium mb-3">유형별 세미나</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(report.programStats.seminarsByType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="rounded-lg bg-muted px-3 py-1.5 text-sm"
                      >
                        <span className="font-medium">{type}</span>
                        <span className="text-muted-foreground ml-1.5">
                          {count}회
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </section>

          {/* 출석률 추이 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">출석률 추이</h2>
            <div className="rounded-xl border bg-card p-6">
              <AttendanceTrendChart data={report.attendanceTrend} />
            </div>
          </section>

          {/* 만족도 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">만족도 분석</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              {(
                [
                  ["overall", report.satisfaction.overallAverage],
                  ["content", report.satisfaction.contentAverage],
                  ["networking", report.satisfaction.networkingAverage],
                  ["applicability", report.satisfaction.applicabilityAverage],
                ] as const
              ).map(([key, avg]) => (
                <div
                  key={key}
                  className="rounded-xl border bg-card p-4 text-center"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {SURVEY_RATING_LABELS[key]}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
                    <span className="text-xl font-bold">{avg}</span>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">NPS</p>
                <span className="text-xl font-bold">
                  {report.satisfaction.npsScore}
                </span>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-sm font-medium mb-4">전반적 만족도 분포</h3>
              <SatisfactionChart data={report.satisfaction} />
            </div>
          </section>

          {/* 인구통계 */}
          <section>
            <h2 className="text-lg font-semibold mb-4">참여자 인구통계</h2>
            <div className="rounded-xl border bg-card p-6">
              <DemographicsChart data={report.demographics} />
            </div>
          </section>

          {/* 교육 주제 */}
          {report.topics.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">교육 주제</h2>
              <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">카테고리</th>
                      <th className="text-center px-4 py-3 font-medium">
                        세미나 수
                      </th>
                      <th className="text-center px-4 py-3 font-medium">
                        총 시간
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topics.map((topic) => (
                      <tr
                        key={topic.category}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-4 py-3">{topic.label}</td>
                        <td className="px-4 py-3 text-center">{topic.count}회</td>
                        <td className="px-4 py-3 text-center">
                          {topic.hours}시간
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 출석률 추이 테이블 */}
          {report.attendanceTrend.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">세미나별 출석 현황</h2>
              <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">날짜</th>
                      <th className="text-left px-4 py-3 font-medium">세미나</th>
                      <th className="text-center px-4 py-3 font-medium">등록</th>
                      <th className="text-center px-4 py-3 font-medium">출석</th>
                      <th className="text-center px-4 py-3 font-medium">출석률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.attendanceTrend.map((row, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="px-4 py-3">{row.date}</td>
                        <td className="px-4 py-3">{row.seminarTitle}</td>
                        <td className="px-4 py-3 text-center">
                          {row.registered}명
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.attended}명
                        </td>
                        <td className="px-4 py-3 text-center">{row.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
