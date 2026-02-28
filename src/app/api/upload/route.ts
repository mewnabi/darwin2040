import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  // 인증: NextAuth 세션 또는 포털 토큰
  const session = await getServerSession(authOptions);
  const portalToken = request.headers.get("x-portal-token");

  if (!session?.user && !portalToken) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  // 포털 토큰 검증
  if (!session?.user && portalToken) {
    const speaker = await prisma.speaker.findUnique({
      where: { portalToken },
    });
    if (
      !speaker ||
      (speaker.portalTokenExp && new Date(speaker.portalTokenExp) < new Date())
    ) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 },
      );
    }
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json(
      { error: "파일이 없습니다" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "지원하지 않는 파일 형식입니다 (이미지, PDF, PPT, DOC 가능)" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "파일 크기는 10MB 이하여야 합니다" },
      { status: 400 },
    );
  }

  const ext = path.extname(file.name) || getExtFromType(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const subDir = isImage ? "images" : "documents";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  const url = `/uploads/${subDir}/${filename}`;

  return NextResponse.json({ url, fileName: file.name, size: file.size });
}

function getExtFromType(type: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  };
  return map[type] || "";
}
