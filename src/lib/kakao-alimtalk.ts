// 카카오 알림톡 유틸리티
// 추후 연동 예정

export async function sendAlimtalk(
  phoneNumber: string,
  templateCode: string,
  variables: Record<string, string>,
) {
  // TODO: 카카오 알림톡 API 연동
  console.log("카카오 알림톡 발송:", { phoneNumber, templateCode, variables });
  return { success: false, message: "알림톡 연동 준비 중" };
}
