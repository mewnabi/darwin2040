export const SEMINAR_TYPE_LABELS: Record<string, string> = {
  MAIN_GAME: "본 게임",
  SPINUP_GAME: "스핀업 게임",
  SPECIAL: "특별 세미나",
};

export const SEMINAR_STATUS_LABELS: Record<string, string> = {
  DRAFT: "초안",
  PUBLISHED: "공개",
  CLOSED: "마감",
  IN_PROGRESS: "진행 중",
  COMPLETED: "완료",
  CANCELLED: "취소됨",
};

export const SEMINAR_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-navy-100 text-navy-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export const SEMINAR_STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["CLOSED", "CANCELLED"],
  CLOSED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
