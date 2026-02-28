import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/members/me/profile - 내 프로필 조회
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      profileImage: true,
      role: true,
      tier: true,
      businessName: true,
      businessType: true,
      businessStage: true,
      birthYear: true,
      gender: true,
      region: true,
      isYouthFounder: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "사용자를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  return NextResponse.json(user);
}

// PUT /api/members/me/profile - 내 프로필 수정
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  // 수정 가능 필드만 허용
  if (body.name !== undefined) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.businessName !== undefined)
    updateData.businessName = body.businessName || null;
  if (body.businessType !== undefined)
    updateData.businessType = body.businessType || null;
  if (body.businessStage !== undefined)
    updateData.businessStage = body.businessStage || null;
  if (body.birthYear !== undefined)
    updateData.birthYear = body.birthYear ? Number(body.birthYear) : null;
  if (body.gender !== undefined) updateData.gender = body.gender || null;
  if (body.region !== undefined) updateData.region = body.region || null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "수정할 항목이 없습니다" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      profileImage: true,
      role: true,
      tier: true,
      businessName: true,
      businessType: true,
      businessStage: true,
      birthYear: true,
      gender: true,
      region: true,
      isYouthFounder: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}
