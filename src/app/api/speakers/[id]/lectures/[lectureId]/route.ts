import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT /api/speakers/[id]/lectures/[lectureId] - 강의 콘텐츠 승인/수정요청
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; lectureId: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const lecture = await prisma.lectureContent.findUnique({
    where: { id: params.lectureId },
    include: { speaker: true },
  });

  if (!lecture || lecture.speakerId !== params.id) {
    return NextResponse.json(
      { error: "강의 콘텐츠를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const { action, reviewComment } = body;

  if (action === "approve") {
    await prisma.$transaction([
      prisma.lectureContent.update({
        where: { id: params.lectureId },
        data: { status: "APPROVED", reviewComment: null },
      }),
      prisma.speaker.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      }),
    ]);

    return NextResponse.json({ success: true, status: "APPROVED" });
  }

  if (action === "request-revision") {
    if (!reviewComment?.trim()) {
      return NextResponse.json(
        { error: "수정 요청 시 검토 의견을 입력해주세요" },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.lectureContent.update({
        where: { id: params.lectureId },
        data: { status: "REVIEWING", reviewComment: reviewComment.trim() },
      }),
      prisma.speaker.update({
        where: { id: params.id },
        data: { status: "INFO_REVIEWING" },
      }),
    ]);

    return NextResponse.json({ success: true, status: "REVIEWING" });
  }

  return NextResponse.json(
    { error: "유효하지 않은 액션입니다 (approve 또는 request-revision)" },
    { status: 400 },
  );
}
