import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/members/me/surveys - 내 미완료 설문 목록
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

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
        select: { id: true, title: true, startAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = pendingSurveys.map((s) => ({
    surveyId: s.id,
    seminarId: s.seminarId,
    seminarTitle: s.seminar.title,
    seminarDate: s.seminar.startAt.toISOString(),
    surveyTitle: s.title,
  }));

  return NextResponse.json(result);
}
