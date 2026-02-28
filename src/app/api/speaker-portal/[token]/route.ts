import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/speaker-portal/[token] - 포털 데이터 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const speaker = await prisma.speaker.findUnique({
    where: { portalToken: params.token },
    include: {
      company: true,
      lectureContents: true,
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
    },
  });

  if (!speaker) {
    return NextResponse.json(
      { error: "유효하지 않은 토큰입니다" },
      { status: 404 },
    );
  }

  if (speaker.portalTokenExp && new Date(speaker.portalTokenExp) < new Date()) {
    return NextResponse.json(
      { error: "토큰이 만료되었습니다. 운영팀에 문의해주세요." },
      { status: 410 },
    );
  }

  return NextResponse.json({
    speaker: {
      id: speaker.id,
      status: speaker.status,
      name: speaker.name,
      email: speaker.email,
      phone: speaker.phone,
      profileImageUrl: speaker.profileImageUrl,
      title: speaker.title,
      organization: speaker.organization,
      education: speaker.education,
      career: speaker.career,
      expertise: speaker.expertise,
    },
    company: speaker.company,
    lectureContents: speaker.lectureContents,
    assignedSeminars: speaker.seminars,
  });
}

// PUT /api/speaker-portal/[token] - 포털 데이터 저장 (단계별)
export async function PUT(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const speaker = await prisma.speaker.findUnique({
    where: { portalToken: params.token },
    include: { seminars: { select: { id: true } } },
  });

  if (!speaker) {
    return NextResponse.json(
      { error: "유효하지 않은 토큰입니다" },
      { status: 404 },
    );
  }

  if (speaker.portalTokenExp && new Date(speaker.portalTokenExp) < new Date()) {
    return NextResponse.json(
      { error: "토큰이 만료되었습니다" },
      { status: 410 },
    );
  }

  const body = await request.json();
  const { step, data, action } = body;

  // Step 1: 기본 프로필
  if (step === 1 && data) {
    await prisma.speaker.update({
      where: { id: speaker.id },
      data: {
        name: data.name || speaker.name,
        phone: data.phone || speaker.phone,
        title: data.title || null,
        organization: data.organization || null,
        profileImageUrl: data.profileImageUrl || speaker.profileImageUrl,
        education: data.education || null,
        career: data.career || null,
      },
    });
  }

  // Step 2: 사업 정보
  if (step === 2 && data) {
    if (!data.companyName) {
      return NextResponse.json(
        { error: "법인명은 필수입니다" },
        { status: 400 },
      );
    }
    await prisma.speakerCompany.upsert({
      where: { speakerId: speaker.id },
      update: {
        companyName: data.companyName,
        establishedAt: data.establishedAt ? new Date(data.establishedAt) : null,
        representative: data.representative || null,
        address: data.address || null,
        businessType: data.businessType || null,
        products: data.products ? JSON.stringify(data.products) : null,
        financials: data.financials ? JSON.stringify(data.financials) : null,
        patents: data.patents || null,
        copyrights: data.copyrights || null,
        certifications: data.certifications || null,
        awards: data.awards || null,
      },
      create: {
        speakerId: speaker.id,
        companyName: data.companyName,
        establishedAt: data.establishedAt ? new Date(data.establishedAt) : null,
        representative: data.representative || null,
        address: data.address || null,
        businessType: data.businessType || null,
        products: data.products ? JSON.stringify(data.products) : null,
        financials: data.financials ? JSON.stringify(data.financials) : null,
        patents: data.patents || null,
        copyrights: data.copyrights || null,
        certifications: data.certifications || null,
        awards: data.awards || null,
      },
    });
  }

  // Step 3: 강의 콘텐츠
  if (step === 3 && data) {
    const seminarId = data.seminarId || speaker.seminars[0]?.id;
    if (!seminarId) {
      return NextResponse.json(
        { error: "배정된 세미나가 없습니다" },
        { status: 400 },
      );
    }

    await prisma.lectureContent.upsert({
      where: { seminarId },
      update: {
        lectureTitle: data.lectureTitle || "",
        businessMotivation: data.businessMotivation || null,
        marketEnvironment: data.marketEnvironment || null,
        successFactors: data.successFactors
          ? JSON.stringify(data.successFactors)
          : null,
        businessModel: data.businessModel || null,
        foundingStory: data.foundingStory || null,
        keyMessages: data.keyMessages
          ? JSON.stringify(data.keyMessages)
          : null,
        category: data.category || null,
      },
      create: {
        speakerId: speaker.id,
        seminarId,
        lectureTitle: data.lectureTitle || "",
        businessMotivation: data.businessMotivation || null,
        marketEnvironment: data.marketEnvironment || null,
        successFactors: data.successFactors
          ? JSON.stringify(data.successFactors)
          : null,
        businessModel: data.businessModel || null,
        foundingStory: data.foundingStory || null,
        keyMessages: data.keyMessages
          ? JSON.stringify(data.keyMessages)
          : null,
        category: data.category || null,
        status: "DRAFT",
      },
    });
  }

  // Step 4: 첨부자료
  if (step === 4 && data) {
    const seminarId = data.seminarId || speaker.seminars[0]?.id;
    if (seminarId) {
      const existing = await prisma.lectureContent.findUnique({
        where: { seminarId },
      });
      if (existing) {
        await prisma.lectureContent.update({
          where: { seminarId },
          data: {
            presentationUrl: data.presentationUrl || existing.presentationUrl,
            attachments: data.attachments
              ? JSON.stringify(data.attachments)
              : existing.attachments,
          },
        });
      }
    }
  }

  // 최종 제출
  if (action === "submit") {
    await prisma.speaker.update({
      where: { id: speaker.id },
      data: { status: "INFO_SUBMITTED" },
    });

    // 강의 콘텐츠 상태 변경
    const seminarId = speaker.seminars[0]?.id;
    if (seminarId) {
      await prisma.lectureContent.updateMany({
        where: { speakerId: speaker.id, seminarId },
        data: { status: "SUBMITTED" },
      });
    }
  }

  return NextResponse.json({ success: true });
}
