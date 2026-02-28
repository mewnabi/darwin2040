export const SPEAKER_STATUS_LABELS: Record<string, string> = {
  CANDIDATE: "후보",
  CONFIRMED: "확정",
  INFO_REQUESTED: "정보 요청",
  INFO_SUBMITTED: "정보 제출",
  INFO_REVIEWING: "검토 중",
  APPROVED: "승인",
  ARCHIVED: "보관",
};

export const SPEAKER_STATUS_COLORS: Record<string, string> = {
  CANDIDATE: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  INFO_REQUESTED: "bg-yellow-100 text-yellow-800",
  INFO_SUBMITTED: "bg-purple-100 text-purple-800",
  INFO_REVIEWING: "bg-orange-100 text-orange-800",
  APPROVED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-200 text-gray-500",
};

export const SPEAKER_STATUS_FLOW: Record<string, string[]> = {
  CANDIDATE: ["CONFIRMED", "ARCHIVED"],
  CONFIRMED: ["INFO_REQUESTED", "ARCHIVED"],
  INFO_REQUESTED: ["ARCHIVED"],
  INFO_SUBMITTED: ["INFO_REVIEWING", "ARCHIVED"],
  INFO_REVIEWING: ["APPROVED", "INFO_REQUESTED"],
  APPROVED: ["ARCHIVED"],
  ARCHIVED: ["CANDIDATE"],
};

export const SETTLEMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "정산 대기",
  PROCESSING: "정산 처리 중",
  COMPLETED: "정산 완료",
};

export const SETTLEMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export const EXPERTISE_TAGS = [
  "프랜차이즈",
  "플랫폼",
  "마케팅",
  "AI/기술",
  "제조/유통",
  "F&B",
  "부동산",
  "금융/투자",
  "콘텐츠/미디어",
  "헬스케어",
  "교육",
  "ESG/지속가능경영",
  "해외진출",
  "스타트업",
  "리더십",
  "조직관리",
] as const;
