import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/members/[id] - 회원 상세
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const member = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      profileImage: true,
      businessName: true,
      businessType: true,
      businessStage: true,
      tier: true,
      role: true,
      region: true,
      birthYear: true,
      gender: true,
      isYouthFounder: true,
      createdAt: true,
      updatedAt: true,
      registrations: {
        select: {
          id: true,
          status: true,
          finalPrice: true,
          registeredAt: true,
          seminar: {
            select: {
              id: true,
              title: true,
              startAt: true,
              type: true,
            },
          },
        },
        orderBy: { registeredAt: "desc" },
        take: 20,
      },
      attendances: {
        select: {
          id: true,
          method: true,
          checkedInAt: true,
          seminar: {
            select: {
              id: true,
              title: true,
              startAt: true,
              type: true,
            },
          },
        },
        orderBy: { checkedInAt: "desc" },
        take: 20,
      },
      _count: {
        select: {
          registrations: true,
          attendances: true,
          surveyResponses: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: "회원을 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  return NextResponse.json(member);
}

// PUT /api/members/[id] - 회원 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const body = await request.json();
  const { role, tier, name, phone, businessName, businessType, businessStage, region } = body;

  // SUPER_ADMIN 역할은 SUPER_ADMIN만 부여 가능
  if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "최고 관리자 역할은 최고 관리자만 부여할 수 있습니다" },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "회원을 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (tier !== undefined) updateData.tier = tier;
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone || null;
  if (businessName !== undefined) updateData.businessName = businessName || null;
  if (businessType !== undefined) updateData.businessType = businessType || null;
  if (businessStage !== undefined) updateData.businessStage = businessStage || null;
  if (region !== undefined) updateData.region = region || null;

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      profileImage: true,
      businessName: true,
      businessType: true,
      businessStage: true,
      tier: true,
      role: true,
      region: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
