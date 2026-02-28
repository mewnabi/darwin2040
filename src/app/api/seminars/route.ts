import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET /api/seminars - 세미나 목록
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.SeminarWhereInput = {};

  if (status) where.status = status as Prisma.EnumSeminarStatusFilter;
  if (type) where.type = type as Prisma.EnumSeminarTypeFilter;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }

  const seminars = await prisma.seminar.findMany({
    where,
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
    orderBy: { startAt: "desc" },
  });

  return NextResponse.json(seminars);
}

// POST /api/seminars - 세미나 생성
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const body = await request.json();

  const {
    title,
    description,
    type,
    startAt,
    endAt,
    venue,
    venueAddress,
    onlineLink,
    maxCapacity,
    basePrice,
    regularDiscount,
    vipDiscount,
    earlyBirdDays,
    earlyBirdRate,
    speakerId,
    category,
    thumbnailUrl,
  } = body;

  if (!title || !type || !startAt || !endAt) {
    return NextResponse.json(
      { error: "필수 항목을 입력해주세요 (제목, 유형, 시작/종료 일시)" },
      { status: 400 },
    );
  }

  const seminar = await prisma.seminar.create({
    data: {
      title,
      description: description || null,
      type,
      status: "DRAFT",
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      venue: venue || null,
      venueAddress: venueAddress || null,
      onlineLink: onlineLink || null,
      maxCapacity: maxCapacity ?? 30,
      basePrice: basePrice ?? 0,
      regularDiscount: regularDiscount ?? 20,
      vipDiscount: vipDiscount ?? 40,
      earlyBirdDays: earlyBirdDays ?? 7,
      earlyBirdRate: earlyBirdRate ?? 10,
      speakerId: speakerId || null,
      category: category || null,
      thumbnailUrl: thumbnailUrl || null,
    },
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

  return NextResponse.json(seminar, { status: 201 });
}
