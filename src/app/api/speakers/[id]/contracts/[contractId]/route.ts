import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT /api/speakers/[id]/contracts/[contractId] - 계약 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const contract = await prisma.speakerContract.findFirst({
    where: { id: params.contractId, speakerId: params.id },
  });
  if (!contract) {
    return NextResponse.json(
      { error: "계약을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.fee !== undefined) updateData.fee = body.fee;
  if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms || null;
  if (body.transportSupport !== undefined) updateData.transportSupport = body.transportSupport;
  if (body.lodgingSupport !== undefined) updateData.lodgingSupport = body.lodgingSupport;
  if (body.taxInvoice !== undefined) updateData.taxInvoice = body.taxInvoice;
  if (body.contractFileUrl !== undefined) updateData.contractFileUrl = body.contractFileUrl || null;
  if (body.settlementStatus !== undefined) {
    updateData.settlementStatus = body.settlementStatus;
    if (body.settlementStatus === "COMPLETED") {
      updateData.settledAt = new Date();
    }
  }

  const updated = await prisma.speakerContract.update({
    where: { id: params.contractId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// DELETE /api/speakers/[id]/contracts/[contractId] - 계약 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; contractId: string } },
) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user?.role ||
    !["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const contract = await prisma.speakerContract.findFirst({
    where: { id: params.contractId, speakerId: params.id },
  });
  if (!contract) {
    return NextResponse.json(
      { error: "계약을 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  if (contract.settlementStatus !== "PENDING") {
    return NextResponse.json(
      { error: "정산 대기 상태의 계약만 삭제할 수 있습니다" },
      { status: 400 },
    );
  }

  await prisma.speakerContract.delete({
    where: { id: params.contractId },
  });

  return NextResponse.json({ success: true });
}
