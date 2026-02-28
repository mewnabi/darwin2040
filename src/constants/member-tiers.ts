export const MEMBER_TIER_LABELS: Record<string, string> = {
  REGULAR: "정회원",
  ASSOCIATE: "준회원",
  VIP: "VIP",
  GUEST: "게스트",
};

export const MEMBER_TIER_COLORS: Record<string, string> = {
  REGULAR: "bg-blue-100 text-blue-800",
  ASSOCIATE: "bg-gray-100 text-gray-800",
  VIP: "bg-gold-100 text-gold-800",
  GUEST: "bg-navy-100 text-navy-800",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "최고 관리자",
  ADMIN: "관리자",
  CHAPTER_LEAD: "지부장",
  MEMBER: "회원",
  ASSOCIATE: "준회원",
  GUEST: "게스트",
};

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "결제 대기",
  PAID: "결제 완료",
  WAITLISTED: "대기자",
  PROMOTED: "대기 승격",
  CANCELLED: "취소됨",
  REFUNDED: "환불됨",
  NO_SHOW: "불참",
};

export const REGISTRATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  WAITLISTED: "bg-blue-100 text-blue-800",
  PROMOTED: "bg-purple-100 text-purple-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "결제 대기",
  COMPLETED: "결제 완료",
  FAILED: "결제 실패",
  PARTIALLY_REFUNDED: "부분 환불",
  FULLY_REFUNDED: "전액 환불",
  CANCELLED: "취소됨",
};
