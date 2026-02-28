import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// GET /api/members - 회원 목록
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const tier = searchParams.get("tier");
  const role = searchParams.get("role");

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (tier) {
    where.tier = tier as Prisma.EnumMemberTierFilter;
  }

  if (role) {
    where.role = role as Prisma.EnumUserRoleFilter;
  }

  const members = await prisma.user.findMany({
    where,
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
      _count: {
        select: {
          registrations: true,
          attendances: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(members);
}
