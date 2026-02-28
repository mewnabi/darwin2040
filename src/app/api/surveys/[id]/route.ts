import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/surveys/:id - 설문 상세 + 통계
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
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
      responses: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!survey) {
    return NextResponse.json(
      { error: "설문을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  // 통계 계산
  const responses = survey.responses;
  const totalResponses = responses.length;

  const averages = {
    overall: 0,
    content: 0,
    networking: 0,
    applicability: 0,
  };

  const distribution = {
    overall: [0, 0, 0, 0, 0],
    content: [0, 0, 0, 0, 0],
    networking: [0, 0, 0, 0, 0],
    applicability: [0, 0, 0, 0, 0],
  };

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  if (totalResponses > 0) {
    for (const r of responses) {
      averages.overall += r.overallRating;
      averages.content += r.contentRating;
      averages.networking += r.networkingRating;
      averages.applicability += r.applicabilityRating;

      distribution.overall[r.overallRating - 1]++;
      distribution.content[r.contentRating - 1]++;
      distribution.networking[r.networkingRating - 1]++;
      distribution.applicability[r.applicabilityRating - 1]++;

      if (r.npsScore >= 9) promoters++;
      else if (r.npsScore >= 7) passives++;
      else detractors++;
    }

    averages.overall = Math.round((averages.overall / totalResponses) * 10) / 10;
    averages.content = Math.round((averages.content / totalResponses) * 10) / 10;
    averages.networking = Math.round((averages.networking / totalResponses) * 10) / 10;
    averages.applicability = Math.round((averages.applicability / totalResponses) * 10) / 10;
  }

  const npsScore =
    totalResponses > 0
      ? Math.round(((promoters - detractors) / totalResponses) * 100)
      : 0;

  const comments = responses
    .filter((r) => r.freeComment)
    .map((r) => ({
      user: r.user?.name || "익명",
      comment: r.freeComment!,
      createdAt: r.createdAt.toISOString(),
    }));

  return NextResponse.json({
    ...survey,
    createdAt: survey.createdAt.toISOString(),
    stats: {
      totalResponses,
      averages,
      nps: { score: npsScore, promoters, passives, detractors },
      distribution,
      comments,
    },
  });
}

// PUT /api/surveys/:id - 설문 활성/비활성 토글
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const body = await request.json();

  const survey = await prisma.survey.update({
    where: { id: params.id },
    data: {
      isActive: body.isActive,
      ...(body.title && { title: body.title }),
    },
  });

  return NextResponse.json(survey);
}

// DELETE /api/surveys/:id - 설문 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 응답이 있는 설문은 삭제 불가
  const responseCount = await prisma.surveyResponse.count({
    where: { surveyId: params.id },
  });

  if (responseCount > 0) {
    return NextResponse.json(
      { error: "응답이 존재하는 설문은 삭제할 수 없습니다. 비활성화를 이용하세요." },
      { status: 400 },
    );
  }

  await prisma.survey.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
