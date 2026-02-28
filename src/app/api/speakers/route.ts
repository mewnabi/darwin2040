import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET /api/speakers - 연사 목록 (필터 지원)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const expertise = searchParams.get("expertise");

  const where: Prisma.SpeakerWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { organization: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status as Prisma.EnumSpeakerStatusFilter;
  }

  if (expertise) {
    where.expertise = { has: expertise };
  }

  const speakers = await prisma.speaker.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      organization: true,
      title: true,
      profileImageUrl: true,
      expertise: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { seminars: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(speakers);
}

// POST /api/speakers - 연사 등록 (관리자 전용)
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
    name,
    email,
    phone,
    title,
    organization,
    education,
    career,
    expertise,
    linkedinUrl,
    youtubeUrl,
    instagramUrl,
    websiteUrl,
    profileImageUrl,
    notes,
  } = body;

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "연사 이름은 필수입니다" },
      { status: 400 },
    );
  }

  const speaker = await prisma.speaker.create({
    data: {
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      title: title || null,
      organization: organization || null,
      education: education || null,
      career: career || null,
      expertise: expertise || [],
      linkedinUrl: linkedinUrl || null,
      youtubeUrl: youtubeUrl || null,
      instagramUrl: instagramUrl || null,
      websiteUrl: websiteUrl || null,
      profileImageUrl: profileImageUrl || null,
      notes: notes || null,
      status: "CANDIDATE",
    },
    include: {
      _count: { select: { seminars: true } },
    },
  });

  return NextResponse.json(speaker, { status: 201 });
}
