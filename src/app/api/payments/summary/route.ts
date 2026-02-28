import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

// GET /api/payments/summary — 매출 요약 (관리자)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily"; // daily | monthly
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // 기본 범위: 최근 30일
  const endDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
  const startDate = from
    ? new Date(from)
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 완료된 결제 조회
  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["COMPLETED", "PARTIALLY_REFUNDED", "FULLY_REFUNDED"],
      },
    },
    select: {
      amount: true,
      refundAmount: true,
      status: true,
      paidAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 날짜별 그룹핑
  const summaryMap = new Map<
    string,
    { totalAmount: number; totalCount: number; refundAmount: number }
  >();

  for (const payment of payments) {
    const date = payment.paidAt || payment.createdAt;
    const key =
      period === "monthly"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const existing = summaryMap.get(key) || {
      totalAmount: 0,
      totalCount: 0,
      refundAmount: 0,
    };

    existing.totalAmount += payment.amount;
    existing.totalCount += 1;
    existing.refundAmount += payment.refundAmount;
    summaryMap.set(key, existing);
  }

  const summary = Array.from(summaryMap.entries()).map(([date, data]) => ({
    date,
    totalAmount: data.totalAmount,
    totalCount: data.totalCount,
    refundAmount: data.refundAmount,
    netAmount: data.totalAmount - data.refundAmount,
  }));

  // 전체 합계
  const totals = {
    totalAmount: summary.reduce((sum, s) => sum + s.totalAmount, 0),
    totalCount: summary.reduce((sum, s) => sum + s.totalCount, 0),
    refundAmount: summary.reduce((sum, s) => sum + s.refundAmount, 0),
    netAmount: summary.reduce((sum, s) => sum + s.netAmount, 0),
  };

  return NextResponse.json({ summary, totals });
}
