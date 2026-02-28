interface CancellationResult {
  canCancel: boolean;
  penaltyPercent: number;
  refundPercent: number;
  reason: string;
}

/**
 * 취소 규칙:
 * - 세미나 시작 48시간 이상 전: 전액 환불
 * - 세미나 시작 24~48시간 전: 50% 위약금
 * - 세미나 시작 24시간 이내: 취소 불가
 */
export function getCancellationRules(
  seminarStartAt: Date | string,
): CancellationResult {
  const hoursUntil =
    (new Date(seminarStartAt).getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntil < 0) {
    return {
      canCancel: false,
      penaltyPercent: 100,
      refundPercent: 0,
      reason: "이미 시작된 세미나는 취소할 수 없습니다.",
    };
  }

  if (hoursUntil < 24) {
    return {
      canCancel: false,
      penaltyPercent: 100,
      refundPercent: 0,
      reason: "세미나 시작 24시간 이내에는 취소할 수 없습니다.",
    };
  }

  if (hoursUntil < 48) {
    return {
      canCancel: true,
      penaltyPercent: 50,
      refundPercent: 50,
      reason: "세미나 시작 48시간 이내 취소 시 50% 위약금이 부과됩니다.",
    };
  }

  return {
    canCancel: true,
    penaltyPercent: 0,
    refundPercent: 100,
    reason: "전액 환불됩니다.",
  };
}
