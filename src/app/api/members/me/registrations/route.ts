import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/members/me/registrations — 내 신청 목록
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const registrations = await prisma.registration.findMany({
    where: { userId: session.user.id },
    include: {
      seminar: {
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          startAt: true,
          endAt: true,
          venue: true,
          venueAddress: true,
          onlineLink: true,
          maxCapacity: true,
          basePrice: true,
        },
      },
      payment: {
        select: {
          id: true,
          orderId: true,
          depositorName: true,
          amount: true,
          status: true,
          method: true,
          paidAt: true,
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });

  return NextResponse.json(registrations);
}
