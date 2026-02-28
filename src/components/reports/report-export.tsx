"use client";

import { Download, Printer } from "lucide-react";
import type { SubsidyReport } from "@/types";

interface ReportExportProps {
  report: SubsidyReport;
  templateName?: string;
}

export function ReportExport({ report, templateName: _templateName }: ReportExportProps) {
  const handleExcelDownload = async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // 프로그램 통계 시트
    const statsData = [
      ["항목", "값"],
      ["보고 기간", `${report.period.from} ~ ${report.period.to}`],
      ["총 세미나 수", report.programStats.totalSeminars],
      ["총 등록 인원", report.programStats.totalRegistrations],
      ["총 참석 인원", report.programStats.totalAttendees],
      ["평균 출석률", `${report.programStats.averageAttendanceRate}%`],
    ];
    const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, statsSheet, "프로그램 통계");

    // 만족도 시트
    const satisfactionData = [
      ["항목", "점수"],
      ["전반적 만족도", report.satisfaction.overallAverage],
      ["콘텐츠 유용성", report.satisfaction.contentAverage],
      ["네트워킹 효과", report.satisfaction.networkingAverage],
      ["비즈니스 적용 의향", report.satisfaction.applicabilityAverage],
      ["NPS 점수", report.satisfaction.npsScore],
      ["총 응답 수", report.satisfaction.responseCount],
    ];
    const satSheet = XLSX.utils.aoa_to_sheet(satisfactionData);
    XLSX.utils.book_append_sheet(wb, satSheet, "만족도");

    // 출석률 추이 시트
    const trendHeaders = ["날짜", "세미나명", "등록", "출석", "출석률(%)"];
    const trendRows = report.attendanceTrend.map((t) => [
      t.date,
      t.seminarTitle,
      t.registered,
      t.attended,
      t.rate,
    ]);
    const trendSheet = XLSX.utils.aoa_to_sheet([trendHeaders, ...trendRows]);
    XLSX.utils.book_append_sheet(wb, trendSheet, "출석률 추이");

    // 교육 주제 시트
    if (report.topics.length > 0) {
      const topicHeaders = ["카테고리", "세미나 수", "총 시간"];
      const topicRows = report.topics.map((t) => [t.label, t.count, t.hours]);
      const topicSheet = XLSX.utils.aoa_to_sheet([topicHeaders, ...topicRows]);
      XLSX.utils.book_append_sheet(wb, topicSheet, "교육 주제");
    }

    const fileName = `보조금_보고서_${report.period.from}_${report.period.to}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex gap-3 print:hidden">
      <button
        type="button"
        onClick={handleExcelDownload}
        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Download className="h-4 w-4" />
        엑셀 다운로드
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        <Printer className="h-4 w-4" />
        인쇄
      </button>
    </div>
  );
}
