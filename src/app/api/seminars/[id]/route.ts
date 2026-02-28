import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/seminars/:id - 세미나 상세
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const seminar = await prisma.seminar.findUnique({
    where: { id: params.id },
    include: {
      speaker: {
        select: {
          id: true,
          name: true,
          organization: true,
          title: true,
          profileImageUrl: true,
          career: true,
          education: true,
          expertise: true,
          linkedinUrl: true,
          websiteUrl: true,
        },
      },
      lectureContent: {
        select: {
          lectureTitle: true,
          businessMotivation: true,
          marketEnvironment: true,
          successFactors: true,
          businessModel: true,
          foundingStory: true,
          keyMessages: true,
          category: true,
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: { in: ["PENDING", "PAID", "PROMOTED"] },
            },
          },
          attendances: true,
          payments: true,
        },
      },
    },
  });

  if (!seminar) {
    return NextResponse.json(
      { error: "세미나를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  return NextResponse.json(seminar);
}

// PUT /api/seminars/:id - 세미나 수정
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

  const existing = await prisma.seminar.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "세미나를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined)
    updateData.description = body.description || null;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.startAt !== undefined) updateData.startAt = new Date(body.startAt);
  if (body.endAt !== undefined) updateData.endAt = new Date(body.endAt);
  if (body.venue !== undefined) updateData.venue = body.venue || null;
  if (body.venueAddress !== undefined)
    updateData.venueAddress = body.venueAddress || null;
  if (body.onlineLink !== undefined)
    updateData.onlineLink = body.onlineLink || null;
  if (body.maxCapacity !== undefined) updateData.maxCapacity = body.maxCapacity;
  if (body.basePrice !== undefined) updateData.basePrice = body.basePrice;
  if (body.regularDiscount !== undefined)
    updateData.regularDiscount = body.regularDiscount;
  if (body.vipDiscount !== undefined)
    updateData.vipDiscount = body.vipDiscount;
  if (body.earlyBirdDays !== undefined)
    updateData.earlyBirdDays = body.earlyBirdDays;
  if (body.earlyBirdRate !== undefined)
    updateData.earlyBirdRate = body.earlyBirdRate;
  if (body.speakerId !== undefined)
    updateData.speakerId = body.speakerId || null;
  if (body.category !== undefined) updateData.category = body.category || null;
  if (body.thumbnailUrl !== undefined)
    updateData.thumbnailUrl = body.thumbnailUrl || null;

  const seminar = await prisma.seminar.update({
    where: { id: params.id },
    data: updateData,
    include: {
      speaker: {
        select: {
          id: true,
          name: true,
          organization: true,
          title: true,
          profileImageUrl: true,
        },
      },
      _count: {
        select: {
          registrations: true,
          attendances: true,
          payments: true,
        },
      },
    },
  });

  // 세미나 완료 시 자동 설문 생성
  if (
    body.status === "COMPLETED" &&
    existing.status !== "COMPLETED"
  ) {
    const existingSurvey = await prisma.survey.findFirst({
      where: { seminarId: params.id },
    });
    if (!existingSurvey) {
      await prisma.survey.create({
        data: {
          seminarId: params.id,
          title: `${seminar.title} 만족도 조사`,
        },
      });
    }
  }

  return NextResponse.json(seminar);
}

// DELETE /api/seminars/:id - 세미나 삭제 (DRAFT만 가능)
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

  const seminar = await prisma.seminar.findUnique({
    where: { id: params.id },
  });

  if (!seminar) {
    return NextResponse.json(
      { error: "세미나를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  if (seminar.status !== "DRAFT") {
    return NextResponse.json(
      { error: "초안 상태의 세미나만 삭제할 수 있습니다" },
      { status: 400 },
    );
  }

  await prisma.seminar.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
