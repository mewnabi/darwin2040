import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/surveys/:id/responses - 설문 응답 제출
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: { seminar: { select: { id: true } } },
  });

  if (!survey) {
    return NextResponse.json(
      { error: "설문을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  if (!survey.isActive) {
    return NextResponse.json(
      { error: "이 설문은 마감되었습니다" },
      { status: 400 },
    );
  }

  // 출석 확인
  const attendance = await prisma.attendance.findFirst({
    where: {
      seminarId: survey.seminarId,
      userId: session.user.id,
    },
  });

  if (!attendance) {
    return NextResponse.json(
      { error: "출석한 세미나만 설문에 참여할 수 있습니다" },
      { status: 403 },
    );
  }

  // 중복 응답 확인
  const existingResponse = await prisma.surveyResponse.findUnique({
    where: {
      surveyId_userId: {
        surveyId: params.id,
        userId: session.user.id,
      },
    },
  });

  if (existingResponse) {
    return NextResponse.json(
      { error: "이미 이 설문에 응답하셨습니다" },
      { status: 409 },
    );
  }

  const body = await request.json();
  const {
    overallRating,
    contentRating,
    networkingRating,
    applicabilityRating,
    npsScore,
    freeComment,
  } = body;

  // 유효성 검증
  const ratings = [overallRating, contentRating, networkingRating, applicabilityRating];
  if (ratings.some((r) => typeof r !== "number" || r < 1 || r > 5)) {
    return NextResponse.json(
      { error: "별점은 1~5 사이여야 합니다" },
      { status: 400 },
    );
  }

  if (typeof npsScore !== "number" || npsScore < 0 || npsScore > 10) {
    return NextResponse.json(
      { error: "NPS 점수는 0~10 사이여야 합니다" },
      { status: 400 },
    );
  }

  const response = await prisma.surveyResponse.create({
    data: {
      surveyId: params.id,
      userId: session.user.id,
      overallRating,
      contentRating,
      networkingRating,
      applicabilityRating,
      npsScore,
      freeComment: freeComment || null,
    },
  });

  return NextResponse.json(response, { status: 201 });
}

// GET /api/surveys/:id/responses - 응답 목록 (관리자)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId: params.id },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(responses);
}
