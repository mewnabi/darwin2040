"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Mic2,
  FileText,
  CreditCard,
  CalendarDays,
  Send,
  Plus,
  Copy,
  ExternalLink,
  Check,
  X,
  Download,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/status-badge";
import { SpeakerForm } from "@/components/speakers/speaker-form";
import { SpeakerContractForm } from "@/components/speakers/speaker-contract-form";
import {
  SPEAKER_STATUS_LABELS,
  SPEAKER_STATUS_COLORS,
  SPEAKER_STATUS_FLOW,
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_COLORS,
} from "@/constants/speaker-status";
import {
  SEMINAR_STATUS_LABELS,
} from "@/constants/seminar-types";
import {
  useSpeaker,
  useUpdateSpeaker,
  useRequestSpeakerInfo,
} from "@/hooks/use-speakers";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminSpeakerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const { data: speaker, isLoading } = useSpeaker(params.id);
  const updateSpeaker = useUpdateSpeaker(params.id);
  const requestInfo = useRequestSpeakerInfo(params.id);

  const [changingStatus, setChangingStatus] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [showContractForm, setShowContractForm] = useState(false);
  const [revisionCommentFor, setRevisionCommentFor] = useState<string | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [lectureActionLoading, setLectureActionLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await updateSpeaker.mutateAsync({ status: newStatus });
      toast({
        title: `상태가 "${SPEAKER_STATUS_LABELS[newStatus]}"(으)로 변경되었습니다`,
      });
    } catch (err) {
      toast({
        title: "상태 변경 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleRequestInfo = async () => {
    try {
      const result = await requestInfo.mutateAsync();
      setPortalUrl(result.portalUrl);
      toast({ title: "정보 요청이 발송되었습니다" });
    } catch (err) {
      toast({
        title: "정보 요청 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  const handleLectureAction = async (
    lectureId: string,
    action: "approve" | "request-revision",
    comment?: string,
  ) => {
    setLectureActionLoading(true);
    try {
      const res = await fetch(
        `/api/speakers/${params.id}/lectures/${lectureId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            reviewComment: comment,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "처리 실패");
      }
      toast({
        title: action === "approve" ? "콘텐츠가 승인되었습니다" : "수정 요청이 전달되었습니다",
      });
      setRevisionCommentFor(null);
      setRevisionComment("");
      // Refresh speaker data
      window.location.reload();
    } catch (err) {
      toast({
        title: "처리 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setLectureActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "클립보드에 복사되었습니다" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!speaker) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">연사를 찾을 수 없습니다.</p>
        <Link href="/admin/speakers">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    );
  }

  const nextStatuses = SPEAKER_STATUS_FLOW[speaker.status] || [];
  const seminarCount = speaker._count?.seminars ?? 0;
  const contractCount = speaker._count?.contracts ?? 0;
  const totalFee = speaker.contracts?.reduce((sum, c) => sum + c.fee, 0) ?? 0;
  const lectureStatus = speaker.lectureContents?.[0]?.status ?? "없음";

  // Construct portal URL from token if available
  const displayPortalUrl =
    portalUrl ||
    (speaker.portalToken
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/speaker/${speaker.portalToken}`
      : "");

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/admin/speakers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          연사 관리
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {speaker.profileImageUrl ? (
              <img
                src={speaker.profileImageUrl}
                alt={speaker.name}
                className="h-16 w-16 rounded-full object-cover border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-navy-100 flex items-center justify-center">
                <Mic2 className="h-7 w-7 text-navy-500" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{speaker.name}</h1>
              <p className="text-sm text-muted-foreground">
                {[speaker.organization, speaker.title].filter(Boolean).join(" / ")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge
                  status={speaker.status}
                  label={SPEAKER_STATUS_LABELS[speaker.status] || speaker.status}
                  colorMap={SPEAKER_STATUS_COLORS}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === "ARCHIVED" ? "destructive" : "outline"}
                size="sm"
                disabled={changingStatus}
                onClick={() => handleStatusChange(status)}
              >
                {changingStatus && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                )}
                {SPEAKER_STATUS_LABELS[status]}(으)로 변경
              </Button>
            ))}
            {(speaker.status === "CONFIRMED" || speaker.status === "INFO_REVIEWING") && (
              <Button
                size="sm"
                onClick={handleRequestInfo}
                disabled={requestInfo.isPending}
              >
                {requestInfo.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                정보 요청
              </Button>
            )}
          </div>
        </div>

        {/* 포털 URL 표시 */}
        {displayPortalUrl && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">포털 URL:</span>
            <code className="text-sm flex-1 truncate">{displayPortalUrl}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => copyToClipboard(displayPortalUrl)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <a href={displayPortalUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">세미나 참여</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seminarCount}회</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">계약 현황</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contractCount}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              총 강연료 {formatCurrency(totalFee)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">콘텐츠 상태</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lectureStatus === "없음" ? "미등록" : lectureStatus}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="company">사업 정보</TabsTrigger>
          <TabsTrigger value="lecture">강의 콘텐츠</TabsTrigger>
          <TabsTrigger value="contracts">계약/정산</TabsTrigger>
          <TabsTrigger value="seminars">
            세미나 이력 ({seminarCount})
          </TabsTrigger>
        </TabsList>

        {/* 기본 정보 */}
        <TabsContent value="info">
          <div className="max-w-3xl">
            <SpeakerForm speaker={speaker} />
          </div>
        </TabsContent>

        {/* 사업 정보 */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>사업 정보</CardTitle>
            </CardHeader>
            <CardContent>
              {speaker.company ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">법인명</p>
                      <p className="font-medium">{speaker.company.companyName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">대표자</p>
                      <p>{speaker.company.representative || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">업종</p>
                      <p>{speaker.company.businessType || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">설립일</p>
                      <p>
                        {speaker.company.establishedAt
                          ? formatDate(speaker.company.establishedAt)
                          : "-"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">주소</p>
                    <p>{speaker.company.address || "-"}</p>
                  </div>
                  {speaker.company.certifications && (
                    <div>
                      <p className="text-sm text-muted-foreground">인증</p>
                      <p>{speaker.company.certifications}</p>
                    </div>
                  )}
                  {speaker.company.patents && (
                    <div>
                      <p className="text-sm text-muted-foreground">특허</p>
                      <p>{speaker.company.patents}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  등록된 사업 정보가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 강의 콘텐츠 */}
        <TabsContent value="lecture">
          {speaker.lectureContents && speaker.lectureContents.length > 0 ? (
            <div className="space-y-6">
              {speaker.lectureContents.map((lc) => {
                let successFactorsList: string[] = [];
                let keyMessagesList: string[] = [];
                let attachmentsList: { name: string; url: string }[] = [];
                try {
                  if (lc.successFactors) successFactorsList = JSON.parse(lc.successFactors);
                } catch { /* empty */ }
                try {
                  if (lc.keyMessages) keyMessagesList = JSON.parse(lc.keyMessages);
                } catch { /* empty */ }
                try {
                  if (lc.attachments) attachmentsList = JSON.parse(lc.attachments);
                } catch { /* empty */ }

                return (
                  <Card key={lc.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{lc.lectureTitle || "제목 없음"}</CardTitle>
                        <StatusBadge
                          status={lc.status}
                          label={{
                            DRAFT: "임시저장",
                            SUBMITTED: "제출됨",
                            REVIEWING: "검토중",
                            APPROVED: "승인됨",
                          }[lc.status] || lc.status}
                          colorMap={{
                            DRAFT: "bg-gray-100 text-gray-800",
                            SUBMITTED: "bg-blue-100 text-blue-800",
                            REVIEWING: "bg-yellow-100 text-yellow-800",
                            APPROVED: "bg-green-100 text-green-800",
                          }}
                        />
                      </div>
                      {lc.category && (
                        <p className="text-sm text-muted-foreground">
                          카테고리: {lc.category}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 검토 코멘트 표시 */}
                      {lc.reviewComment && (
                        <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800">검토 의견</p>
                            <p className="text-sm text-yellow-700 mt-1">{lc.reviewComment}</p>
                          </div>
                        </div>
                      )}

                      {lc.businessMotivation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">사업 시작 동기</p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{lc.businessMotivation}</p>
                        </div>
                      )}
                      {lc.marketEnvironment && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">사업 환경과 기회</p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{lc.marketEnvironment}</p>
                        </div>
                      )}
                      {successFactorsList.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">핵심 성공 요인</p>
                          <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                            {successFactorsList.map((factor, i) => (
                              <li key={i}>{factor}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {lc.businessModel && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">비즈니스 모델</p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{lc.businessModel}</p>
                        </div>
                      )}
                      {lc.foundingStory && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">창업/성장 스토리</p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{lc.foundingStory}</p>
                        </div>
                      )}
                      {keyMessagesList.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">학습 핵심 메시지</p>
                          <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                            {keyMessagesList.map((msg, i) => (
                              <li key={i}>{msg}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* 첨부자료 섹션 */}
                      {(lc.presentationUrl || attachmentsList.length > 0) && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">첨부자료</p>
                          <div className="space-y-2">
                            {lc.presentationUrl && (
                              <a
                                href={lc.presentationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-navy-500 hover:underline"
                              >
                                <Download className="h-4 w-4" />
                                발표자료
                              </a>
                            )}
                            {attachmentsList.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-navy-500 hover:underline"
                              >
                                <Download className="h-4 w-4" />
                                {att.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 승인/수정요청 */}
                      {(lc.status === "SUBMITTED" || lc.status === "REVIEWING") && (
                        <div className="border-t pt-4">
                          {revisionCommentFor === lc.id ? (
                            <div className="space-y-3">
                              <div>
                                <Label>수정 요청 의견</Label>
                                <Textarea
                                  value={revisionComment}
                                  onChange={(e) => setRevisionComment(e.target.value)}
                                  placeholder="연사에게 전달할 수정 요청 의견을 입력해주세요"
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={!revisionComment.trim() || lectureActionLoading}
                                  onClick={() =>
                                    handleLectureAction(lc.id, "request-revision", revisionComment)
                                  }
                                >
                                  {lectureActionLoading && (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  )}
                                  수정 요청 전송
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setRevisionCommentFor(null);
                                    setRevisionComment("");
                                  }}
                                >
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={lectureActionLoading}
                                onClick={() => handleLectureAction(lc.id, "approve")}
                              >
                                {lectureActionLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRevisionCommentFor(lc.id)}
                              >
                                <X className="h-3 w-3 mr-1" />
                                수정 요청
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent>
                <p className="text-muted-foreground py-8 text-center">
                  등록된 강의 콘텐츠가 없습니다.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 계약/정산 */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>계약/정산</CardTitle>
              <Button size="sm" onClick={() => setShowContractForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                새 계약
              </Button>
            </CardHeader>
            <CardContent>
              {speaker.contracts && speaker.contracts.length > 0 ? (
                <div className="space-y-3">
                  {speaker.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">
                          {formatCurrency(contract.fee)}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{contract.paymentTerms || "조건 미정"}</span>
                          {contract.transportSupport && <span>교통비</span>}
                          {contract.lodgingSupport && <span>숙박비</span>}
                          {contract.taxInvoice && <span>세금계산서</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(contract.createdAt)}
                        </p>
                      </div>
                      <StatusBadge
                        status={contract.settlementStatus}
                        label={
                          SETTLEMENT_STATUS_LABELS[contract.settlementStatus] ||
                          contract.settlementStatus
                        }
                        colorMap={SETTLEMENT_STATUS_COLORS}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  등록된 계약이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
          <SpeakerContractForm
            speakerId={params.id}
            open={showContractForm}
            onOpenChange={setShowContractForm}
          />
        </TabsContent>

        {/* 세미나 이력 */}
        <TabsContent value="seminars">
          <Card>
            <CardHeader>
              <CardTitle>세미나 이력</CardTitle>
            </CardHeader>
            <CardContent>
              {speaker.seminars && speaker.seminars.length > 0 ? (
                <div className="space-y-3">
                  {speaker.seminars.map((seminar) => (
                    <Link
                      key={seminar.id}
                      href={`/admin/seminars/${seminar.id}`}
                      className="block border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{seminar.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(seminar.startAt)}
                          </p>
                        </div>
                        <StatusBadge
                          status={seminar.status}
                          label={SEMINAR_STATUS_LABELS[seminar.status] || seminar.status}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  배정된 세미나가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
