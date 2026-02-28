import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole, Prisma } from "@prisma/client";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

// GET /api/seminars/:id/registrations — 세미나별 신청자 목록 (관리자)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const seminarId = params.id;

  // 세미나 존재 확인
  const seminar = await prisma.seminar.findUnique({
    where: { id: seminarId },
    select: { id: true, title: true, startAt: true, maxCapacity: true },
  });

  if (!seminar) {
    return NextResponse.json({ error: "세미나를 찾을 수 없습니다." }, { status: 404 });
  }

  // 상태 필터
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  const where: Prisma.RegistrationWhereInput = { seminarId };
  if (statusFilter) {
    where.status = statusFilter as Prisma.EnumRegistrationStatusFilter;
  }

  const registrations = await prisma.registration.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          tier: true,
        },
      },
      payment: {
        select: {
          id: true,
          orderId: true,
          amount: true,
          status: true,
          method: true,
          paidAt: true,
          refundAmount: true,
          refundedAt: true,
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });

  // 상태별 통계
  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "PENDING").length,
    paid: registrations.filter((r) => r.status === "PAID").length,
    waitlisted: registrations.filter((r) => r.status === "WAITLISTED").length,
    promoted: registrations.filter((r) => r.status === "PROMOTED").length,
    cancelled: registrations.filter((r) => r.status === "CANCELLED").length,
    refunded: registrations.filter((r) => r.status === "REFUNDED").length,
    noShow: registrations.filter((r) => r.status === "NO_SHOW").length,
  };

  return NextResponse.json({ seminar, registrations, stats });
}
