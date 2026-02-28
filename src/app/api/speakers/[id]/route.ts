import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SPEAKER_STATUS_FLOW } from "@/constants/speaker-status";

// GET /api/speakers/[id] - 연사 상세
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const speaker = await prisma.speaker.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      contracts: { orderBy: { createdAt: "desc" } },
      seminars: {
        select: {
          id: true,
          title: true,
          startAt: true,
          status: true,
          type: true,
        },
        orderBy: { startAt: "desc" },
      },
      lectureContents: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          seminars: true,
          contracts: true,
          lectureContents: true,
        },
      },
    },
  });

  if (!speaker) {
    return NextResponse.json(
      { error: "연사를 찾을 수 없습니다" },
      { status: 404 },
    );
  }

  return NextResponse.json(speaker);
}

// PUT /api/speakers/[id] - 연사 수정 (관리자 전용)
export async function PUT(
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

  const existing = await prisma.speaker.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "연사를 찾을 수 없습니다" },
      { status: 404 },
    );
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
    status,
    company,
  } = body;

  // 상태 전이 검증
  if (status && status !== existing.status) {
    const allowedTransitions = SPEAKER_STATUS_FLOW[existing.status] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          error: `${existing.status}에서 ${status}(으)로의 상태 변경은 허용되지 않습니다`,
        },
        { status: 400 },
      );
    }
  }

  // 연사 업데이트
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (email !== undefined) updateData.email = email || null;
  if (phone !== undefined) updateData.phone = phone || null;
  if (title !== undefined) updateData.title = title || null;
  if (organization !== undefined) updateData.organization = organization || null;
  if (education !== undefined) updateData.education = education || null;
  if (career !== undefined) updateData.career = career || null;
  if (expertise !== undefined) updateData.expertise = expertise;
  if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl || null;
  if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl || null;
  if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl || null;
  if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
  if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl || null;
  if (notes !== undefined) updateData.notes = notes || null;
  if (status !== undefined) updateData.status = status;

  const speaker = await prisma.speaker.update({
    where: { id: params.id },
    data: updateData,
    include: {
      company: true,
      _count: { select: { seminars: true, contracts: true, lectureContents: true } },
    },
  });

  // 회사 정보 upsert
  if (company) {
    await prisma.speakerCompany.upsert({
      where: { speakerId: params.id },
      update: {
        companyName: company.companyName,
        establishedAt: company.establishedAt ? new Date(company.establishedAt) : null,
        representative: company.representative || null,
        address: company.address || null,
        businessType: company.businessType || null,
        products: company.products || null,
        financials: company.financials || null,
        patents: company.patents || null,
        copyrights: company.copyrights || null,
        certifications: company.certifications || null,
        awards: company.awards || null,
      },
      create: {
        speakerId: params.id,
        companyName: company.companyName,
        establishedAt: company.establishedAt ? new Date(company.establishedAt) : null,
        representative: company.representative || null,
        address: company.address || null,
        businessType: company.businessType || null,
        products: company.products || null,
        financials: company.financials || null,
        patents: company.patents || null,
        copyrights: company.copyrights || null,
        certifications: company.certifications || null,
        awards: company.awards || null,
      },
    });
  }

  return NextResponse.json(speaker);
}
