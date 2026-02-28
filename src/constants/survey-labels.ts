export const SURVEY_RATING_LABELS: Record<string, string> = {
  overall: "전반적 만족도",
  content: "콘텐츠 유용성",
  networking: "네트워킹 효과",
  applicability: "비즈니스 적용 의향",
};

export const SURVEY_RATING_KEYS = [
  "overall",
  "content",
  "networking",
  "applicability",
] as const;

export const NPS_LABELS: Record<string, string> = {
  promoters: "추천 (9-10)",
  passives: "중립 (7-8)",
  detractors: "비추천 (0-6)",
};

export const REPORT_TEMPLATES = [
  {
    value: "youth_startup" as const,
    label: "청년창업 지원사업",
    description: "청년 창업자 대상 교육 프로그램 성과 보고",
  },
  {
    value: "regional_balance" as const,
    label: "지역균형 발전사업",
    description: "지역 중소기업 역량 강화 프로그램 성과 보고",
  },
  {
    value: "ai_education" as const,
    label: "AI 교육 혁신사업",
    description: "AI/디지털 전환 교육 프로그램 성과 보고",
  },
];

export const REPORT_PERIOD_OPTIONS = [
  { value: "quarter" as const, label: "분기별" },
  { value: "half" as const, label: "반기별" },
  { value: "annual" as const, label: "연간" },
  { value: "custom" as const, label: "직접 지정" },
];

export const AGE_GROUP_RANGES = [
  { label: "20대", min: 20, max: 29 },
  { label: "30대", min: 30, max: 39 },
  { label: "40대", min: 40, max: 49 },
  { label: "50대", min: 50, max: 59 },
  { label: "60대 이상", min: 60, max: 999 },
];

export const STAR_LABELS = ["매우 불만족", "불만족", "보통", "만족", "매우 만족"];
