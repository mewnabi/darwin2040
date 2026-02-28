import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/speakers/[id]/contracts - 계약 목록
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const contracts = await prisma.speakerContract.findMany({
    where: { speakerId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(contracts);
}

// POST /api/speakers/[id]/contracts - 계약 생성
export async function POST(
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

  const speaker = await prisma.speaker.findUnique({
    where: { id: params.id },
  });
  if (!speaker) {
    return NextResponse.json(
      { error: "연사를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const {
    seminarId,
    fee,
    paymentTerms,
    transportSupport,
    lodgingSupport,
    taxInvoice,
    contractFileUrl,
  } = body;

  const contract = await prisma.speakerContract.create({
    data: {
      speakerId: params.id,
      seminarId: seminarId || null,
      fee: fee ?? 0,
      paymentTerms: paymentTerms || null,
      transportSupport: transportSupport ?? false,
      lodgingSupport: lodgingSupport ?? false,
      taxInvoice: taxInvoice ?? false,
      contractFileUrl: contractFileUrl || null,
      settlementStatus: "PENDING",
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
