import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/surveys - 설문 목록
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(
    session.user.role,
  );

  if (isAdmin) {
    const surveys = await prisma.survey.findMany({
      include: {
        seminar: {
          select: {
            id: true,
            title: true,
            startAt: true,
            type: true,
            speaker: { select: { name: true } },
          },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(surveys);
  }

  // 회원: 미응답 설문 (출석한 세미나)
  const pendingSurveys = await prisma.survey.findMany({
    where: {
      isActive: true,
      seminar: {
        attendances: {
          some: { userId: session.user.id },
        },
      },
      responses: {
        none: { userId: session.user.id },
      },
    },
    include: {
      seminar: {
        select: { id: true, title: true, startAt: true, type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pendingSurveys);
}

// POST /api/surveys - 설문 생성
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const body = await request.json();
  const { seminarId, title } = body;

  if (!seminarId) {
    return NextResponse.json(
      { error: "세미나 ID가 필요합니다" },
      { status: 400 },
    );
  }

  const existing = await prisma.survey.findFirst({
    where: { seminarId },
  });

  if (existing) {
    return NextResponse.json(
      { error: "이 세미나에 이미 설문이 존재합니다" },
      { status: 409 },
    );
  }

  const survey = await prisma.survey.create({
    data: {
      seminarId,
      title: title || "세미나 만족도 조사",
    },
    include: {
      seminar: {
        select: { id: true, title: true, startAt: true, type: true },
      },
      _count: { select: { responses: true } },
    },
  });

  return NextResponse.json(survey, { status: 201 });
}
