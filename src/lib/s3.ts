// AWS S3 파일 업로드 유틸리티
// 추후 연동 예정 (로컬 fallback)

export async function uploadFile(file: File, path: string) {
  // TODO: AWS S3 연동, 현재는 로컬 fallback
  console.log("파일 업로드:", { path, size: file.size });
  return { success: false, url: "", message: "파일 업로드 연동 준비 중" };
}

export async function deleteFile(url: string) {
  // TODO: AWS S3 파일 삭제
  console.log("파일 삭제:", { url });
  return { success: false, message: "파일 삭제 연동 준비 중" };
}
