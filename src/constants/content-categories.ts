export const CONTENT_CATEGORIES = [
  { value: "startup", label: "창업" },
  { value: "marketing", label: "마케팅" },
  { value: "finance", label: "재무/회계" },
  { value: "hr", label: "인사/조직" },
  { value: "technology", label: "기술/IT" },
  { value: "leadership", label: "리더십" },
  { value: "sales", label: "영업/세일즈" },
  { value: "legal", label: "법률/규제" },
  { value: "global", label: "글로벌/해외진출" },
  { value: "innovation", label: "혁신/R&D" },
  { value: "sustainability", label: "ESG/지속가능경영" },
  { value: "networking", label: "네트워킹" },
] as const;

export type ContentCategory = (typeof CONTENT_CATEGORIES)[number]["value"];
