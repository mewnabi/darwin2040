import { randomUUID } from "crypto";
import QRCode from "qrcode";

/**
 * 세미나용 QR 코드 생성 (per-seminar 방식)
 * 각 세미나에 고유한 QR 코드를 할당하여 프로젝터에 표시
 */
export function generateSeminarQRCode(): string {
  return randomUUID();
}

/**
 * QR 이미지를 base64 Data URL로 생성
 */
export async function generateQRImage(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: "#1B2A4A", // Navy 브랜드 컬러
      light: "#FFFFFF",
    },
  });
}

/**
 * QR 코드 유효 시간 확인
 */
export function isQRValid(
  validFrom: Date | null,
  validUntil: Date | null,
): boolean {
  if (!validFrom || !validUntil) return false;
  const now = new Date();
  return now >= validFrom && now <= validUntil;
}
