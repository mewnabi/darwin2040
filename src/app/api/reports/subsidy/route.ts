import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import { AGE_GROUP_RANGES } from "@/constants/survey-labels";

// GET /api/reports/subsidy - 보조금 보고서 집계
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "기간(from, to)이 필요합니다" },
      { status: 400 },
    );
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  // 기간 내 완료된 세미나 조회
  const seminars = await prisma.seminar.findMany({
    where: {
      startAt: { gte: fromDate, lte: toDate },
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
    },
    include: {
      registrations: {
        where: { status: { in: ["PAID", "PROMOTED"] } },
      },
      attendances: {
        include: {
          user: {
            select: { id: true, birthYear: true, gender: true, region: true },
          },
        },
      },
      surveys: {
        include: { responses: true },
      },
      speaker: { select: { name: true } },
    },
    orderBy: { startAt: "asc" },
  });

  // 프로그램 통계
  const totalSeminars = seminars.length;
  const totalRegistrations = seminars.reduce(
    (sum, s) => sum + s.registrations.length,
    0,
  );
  const totalAttendees = seminars.reduce(
    (sum, s) => sum + s.attendances.length,
    0,
  );
  const averageAttendanceRate =
    totalRegistrations > 0
      ? Math.round((totalAttendees / totalRegistrations) * 100)
      : 0;

  const seminarsByType: Record<string, number> = {};
  for (const s of seminars) {
    const label = SEMINAR_TYPE_LABELS[s.type] || s.type;
    seminarsByType[label] = (seminarsByType[label] || 0) + 1;
  }

  // 인구통계
  const allAttendeeUsers = new Map<
    string,
    { birthYear: number | null; gender: string | null; region: string | null }
  >();
  for (const s of seminars) {
    for (const a of s.attendances) {
      if (a.user && !allAttendeeUsers.has(a.user.id)) {
        allAttendeeUsers.set(a.user.id, {
          birthYear: a.user.birthYear,
          gender: a.user.gender,
          region: a.user.region,
        });
      }
    }
  }

  const ageGroups = AGE_GROUP_RANGES.map((range) => ({ label: range.label, count: 0 }));
  const genderMap: Record<string, number> = { 남성: 0, 여성: 0, 기타: 0 };
  const regionMap: Record<string, number> = {};

  allAttendeeUsers.forEach((user) => {
    // 연령대
    if (user.birthYear) {
      const age = new Date().getFullYear() - user.birthYear;
      const group = AGE_GROUP_RANGES.findIndex(
        (r) => age >= r.min && age <= r.max,
      );
      if (group >= 0) ageGroups[group].count++;
    }

    // 성별
    if (user.gender) {
      const key =
        user.gender === "MALE"
          ? "남성"
          : user.gender === "FEMALE"
            ? "여성"
            : "기타";
      genderMap[key]++;
    }

    // 지역
    if (user.region) {
      regionMap[user.region] = (regionMap[user.region] || 0) + 1;
    }
  });

  // 만족도
  let totalOverall = 0;
  let totalContent = 0;
  let totalNetworking = 0;
  let totalApplicability = 0;
  let responseCount = 0;
  const distribution = [0, 0, 0, 0, 0];
  let promoters = 0;
  let detractors = 0;

  for (const s of seminars) {
    for (const survey of s.surveys) {
      for (const r of survey.responses) {
        totalOverall += r.overallRating;
        totalContent += r.contentRating;
        totalNetworking += r.networkingRating;
        totalApplicability += r.applicabilityRating;
        distribution[r.overallRating - 1]++;
        if (r.npsScore >= 9) promoters++;
        else if (r.npsScore <= 6) detractors++;
        responseCount++;
      }
    }
  }

  // 교육 주제
  const topicMap: Record<string, { count: number; hours: number }> = {};
  for (const s of seminars) {
    const category = s.category || "기타";
    if (!topicMap[category]) topicMap[category] = { count: 0, hours: 0 };
    topicMap[category].count++;
    const durationHours =
      (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) /
      (1000 * 60 * 60);
    topicMap[category].hours += Math.round(durationHours * 10) / 10;
  }

  // 출석률 추이
  const attendanceTrend = seminars.map((s) => ({
    date: s.startAt.toISOString().split("T")[0],
    seminarTitle: s.title,
    registered: s.registrations.length,
    attended: s.attendances.length,
    rate:
      s.registrations.length > 0
        ? Math.round((s.attendances.length / s.registrations.length) * 100)
        : 0,
  }));

  return NextResponse.json({
    period: { from, to },
    programStats: {
      totalSeminars,
      totalRegistrations,
      totalAttendees,
      averageAttendanceRate,
      seminarsByType,
    },
    demographics: {
      ageGroups,
      genderDistribution: Object.entries(genderMap).map(([label, count]) => ({
        label,
        count,
      })),
      regionDistribution: Object.entries(regionMap)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    },
    satisfaction: {
      overallAverage:
        responseCount > 0
          ? Math.round((totalOverall / responseCount) * 10) / 10
          : 0,
      contentAverage:
        responseCount > 0
          ? Math.round((totalContent / responseCount) * 10) / 10
          : 0,
      networkingAverage:
        responseCount > 0
          ? Math.round((totalNetworking / responseCount) * 10) / 10
          : 0,
      applicabilityAverage:
        responseCount > 0
          ? Math.round((totalApplicability / responseCount) * 10) / 10
          : 0,
      npsScore:
        responseCount > 0
          ? Math.round(((promoters - detractors) / responseCount) * 100)
          : 0,
      responseCount,
      distribution,
    },
    topics: Object.entries(topicMap).map(([category, data]) => ({
      category,
      label: category,
      count: data.count,
      hours: data.hours,
    })),
    attendanceTrend,
  });
}
