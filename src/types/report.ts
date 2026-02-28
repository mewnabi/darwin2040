export interface SubsidyReport {
  period: { from: string; to: string };
  programStats: ProgramStats;
  demographics: DemographicData;
  satisfaction: SatisfactionData;
  topics: EducationTopic[];
  attendanceTrend: AttendanceTrend[];
}

export interface ProgramStats {
  totalSeminars: number;
  totalRegistrations: number;
  totalAttendees: number;
  averageAttendanceRate: number;
  seminarsByType: Record<string, number>;
}

export interface DemographicData {
  ageGroups: { label: string; count: number }[];
  genderDistribution: { label: string; count: number }[];
  regionDistribution: { label: string; count: number }[];
}

export interface SatisfactionData {
  overallAverage: number;
  contentAverage: number;
  networkingAverage: number;
  applicabilityAverage: number;
  npsScore: number;
  responseCount: number;
  distribution: number[];
}

export interface EducationTopic {
  category: string;
  label: string;
  count: number;
  hours: number;
}

export interface AttendanceTrend {
  date: string;
  seminarTitle: string;
  registered: number;
  attended: number;
  rate: number;
}

export type ReportTemplate = "youth_startup" | "regional_balance" | "ai_education";

export type ReportPeriod = "quarter" | "half" | "annual" | "custom";
