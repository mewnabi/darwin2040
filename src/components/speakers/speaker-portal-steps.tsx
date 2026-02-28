"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  Plus,
  X,
  Upload,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTENT_CATEGORIES } from "@/constants/content-categories";
import {
  useSpeakerPortal,
  useSavePortalStep,
  useSubmitPortal,
} from "@/hooks/use-speaker-portal";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { number: 1, label: "기본 프로필" },
  { number: 2, label: "사업 정보" },
  { number: 3, label: "강의 콘텐츠" },
  { number: 4, label: "첨부자료" },
];

interface SpeakerPortalStepsProps {
  token: string;
}

export function SpeakerPortalSteps({ token }: SpeakerPortalStepsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, error } = useSpeakerPortal(token);
  const saveStep = useSavePortalStep(token);
  const submitPortal = useSubmitPortal(token);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [step1, setStep1] = useState<Record<string, string>>({});
  // Step 2 state
  const [step2, setStep2] = useState<Record<string, unknown>>({});
  const [products, setProducts] = useState<{ name: string; description: string }[]>([]);
  const [financials, setFinancials] = useState<{ year: string; revenue: string; operatingProfit: string }[]>([]);
  // Step 3 state
  const [step3, setStep3] = useState<Record<string, unknown>>({});
  const [successFactors, setSuccessFactors] = useState<string[]>([""]);
  const [keyMessages, setKeyMessages] = useState<string[]>([""]);
  // Step 4 state
  const [presentationUrl, setPresentationUrl] = useState<string>("");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);

  const [initialized, setInitialized] = useState(false);

  // Initialize form data from API response
  if (data && !initialized) {
    const s = data.speaker;
    setStep1({
      name: s.name || "",
      phone: s.phone || "",
      title: s.title || "",
      organization: s.organization || "",
      education: s.education || "",
      career: s.career || "",
    });

    if (data.company) {
      const c = data.company;
      setStep2({
        companyName: c.companyName || "",
        establishedAt: c.establishedAt ? c.establishedAt.split("T")[0] : "",
        representative: c.representative || "",
        address: c.address || "",
        businessType: c.businessType || "",
        patents: c.patents || "",
        copyrights: c.copyrights || "",
        certifications: c.certifications || "",
        awards: c.awards || "",
      });
      try {
        if (c.products) setProducts(JSON.parse(c.products));
      } catch { /* empty */ }
      try {
        if (c.financials) setFinancials(JSON.parse(c.financials));
      } catch { /* empty */ }
    }

    if (data.lectureContents?.[0]) {
      const lc = data.lectureContents[0];
      setStep3({
        lectureTitle: lc.lectureTitle || "",
        businessMotivation: lc.businessMotivation || "",
        marketEnvironment: lc.marketEnvironment || "",
        businessModel: lc.businessModel || "",
        foundingStory: lc.foundingStory || "",
        category: lc.category || "",
      });
      try {
        if (lc.successFactors) setSuccessFactors(JSON.parse(lc.successFactors));
      } catch { /* empty */ }
      try {
        if (lc.keyMessages) setKeyMessages(JSON.parse(lc.keyMessages));
      } catch { /* empty */ }
      setPresentationUrl(lc.presentationUrl || "");
      try {
        if (lc.attachments) setAttachments(JSON.parse(lc.attachments));
      } catch { /* empty */ }
    }

    setInitialized(true);
  }

  const handleSave = useCallback(
    async (step: number) => {
      let stepData: Record<string, unknown> = {};

      if (step === 1) {
        stepData = { ...step1 };
      } else if (step === 2) {
        stepData = {
          ...step2,
          products: products.filter((p) => p.name),
          financials: financials.filter((f) => f.year),
        };
      } else if (step === 3) {
        stepData = {
          ...step3,
          successFactors: successFactors.filter(Boolean),
          keyMessages: keyMessages.filter(Boolean),
          seminarId: data?.assignedSeminars?.[0]?.id,
        };
      } else if (step === 4) {
        stepData = {
          presentationUrl,
          attachments,
          seminarId: data?.assignedSeminars?.[0]?.id,
        };
      }

      try {
        await saveStep.mutateAsync({ step, data: stepData });
        toast({ title: "임시저장 되었습니다" });
      } catch (err) {
        toast({
          title: "저장 실패",
          description: err instanceof Error ? err.message : "다시 시도해주세요",
          variant: "destructive",
        });
        throw err;
      }
    },
    [step1, step2, step3, products, financials, successFactors, keyMessages, presentationUrl, attachments, data, saveStep, toast],
  );

  const goNext = async () => {
    try {
      await handleSave(currentStep);
      setCurrentStep((s) => Math.min(s + 1, 4));
    } catch {
      // save failed, stay on current step
    }
  };

  const goPrev = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      await handleSave(currentStep);
      await submitPortal.mutateAsync();
      toast({ title: "정보가 성공적으로 제출되었습니다!" });
      router.push(`/speaker/${token}/complete`);
    } catch (err) {
      toast({
        title: "제출 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File, onSuccess: (url: string, name: string) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-portal-token": token },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const { url, fileName } = await res.json();
      onSuccess(url, fileName);
    } catch (err) {
      toast({
        title: "업로드 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">접속할 수 없습니다</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "유효하지 않은 링크입니다"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const reviewComment = data.lectureContents?.[0]?.reviewComment;
  const hasAssignedSeminar = (data.assignedSeminars?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      {/* 검토 코멘트 알림 */}
      {reviewComment && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">운영팀 검토 의견</p>
                <p className="text-sm text-yellow-700 mt-1">{reviewComment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 스텝 인디케이터 */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep === step.number
                    ? "bg-navy-500 text-white"
                    : currentStep > step.number
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.number
                )}
              </div>
              <span className="text-xs mt-1 text-center hidden sm:block">
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-16 mx-1 sm:mx-2 ${
                  currentStep > step.number ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 기본 프로필 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>기본 프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>이름 *</Label>
                <Input
                  value={step1.name || ""}
                  onChange={(e) => setStep1({ ...step1, name: e.target.value })}
                />
              </div>
              <div>
                <Label>연락처</Label>
                <Input
                  value={step1.phone || ""}
                  onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>직함 *</Label>
                <Input
                  value={step1.title || ""}
                  onChange={(e) => setStep1({ ...step1, title: e.target.value })}
                  placeholder="대표이사, CEO 등"
                />
              </div>
              <div>
                <Label>소속 *</Label>
                <Input
                  value={step1.organization || ""}
                  onChange={(e) =>
                    setStep1({ ...step1, organization: e.target.value })
                  }
                  placeholder="회사/기관명"
                />
              </div>
            </div>
            <div>
              <Label>학력</Label>
              <Input
                value={step1.education || ""}
                onChange={(e) =>
                  setStep1({ ...step1, education: e.target.value })
                }
                placeholder="대학교/전공"
              />
            </div>
            <div>
              <Label>주요 경력</Label>
              <Textarea
                value={step1.career || ""}
                onChange={(e) => setStep1({ ...step1, career: e.target.value })}
                placeholder="주요 경력을 입력해주세요"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 사업 정보 */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>사업 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>법인명 *</Label>
              <Input
                value={(step2.companyName as string) || ""}
                onChange={(e) =>
                  setStep2({ ...step2, companyName: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>설립일</Label>
                <Input
                  type="date"
                  value={(step2.establishedAt as string) || ""}
                  onChange={(e) =>
                    setStep2({ ...step2, establishedAt: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>대표자</Label>
                <Input
                  value={(step2.representative as string) || ""}
                  onChange={(e) =>
                    setStep2({ ...step2, representative: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>주소</Label>
              <Input
                value={(step2.address as string) || ""}
                onChange={(e) =>
                  setStep2({ ...step2, address: e.target.value })
                }
              />
            </div>
            <div>
              <Label>업종</Label>
              <Input
                value={(step2.businessType as string) || ""}
                onChange={(e) =>
                  setStep2({ ...step2, businessType: e.target.value })
                }
              />
            </div>

            {/* 제품/서비스 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>제품/서비스</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProducts([...products, { name: "", description: "" }])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
              {products.map((product, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="제품/서비스명"
                    value={product.name}
                    onChange={(e) => {
                      const updated = [...products];
                      updated[index] = { ...product, name: e.target.value };
                      setProducts(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="설명"
                    value={product.description}
                    onChange={(e) => {
                      const updated = [...products];
                      updated[index] = {
                        ...product,
                        description: e.target.value,
                      };
                      setProducts(updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setProducts(products.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 사업 실적 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>사업 실적 (연도별)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFinancials([
                      ...financials,
                      { year: "", revenue: "", operatingProfit: "" },
                    ])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </div>
              {financials.map((fin, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    placeholder="연도"
                    value={fin.year}
                    onChange={(e) => {
                      const updated = [...financials];
                      updated[index] = { ...fin, year: e.target.value };
                      setFinancials(updated);
                    }}
                    className="w-24"
                  />
                  <Input
                    placeholder="매출액"
                    value={fin.revenue}
                    onChange={(e) => {
                      const updated = [...financials];
                      updated[index] = { ...fin, revenue: e.target.value };
                      setFinancials(updated);
                    }}
                    className="flex-1"
                  />
                  <Input
                    placeholder="영업이익"
                    value={fin.operatingProfit}
                    onChange={(e) => {
                      const updated = [...financials];
                      updated[index] = {
                        ...fin,
                        operatingProfit: e.target.value,
                      };
                      setFinancials(updated);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setFinancials(financials.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* 자격/인증 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>특허</Label>
                <Input
                  value={(step2.patents as string) || ""}
                  onChange={(e) =>
                    setStep2({ ...step2, patents: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>인증 (벤처인증, 연구소 등)</Label>
                <Input
                  value={(step2.certifications as string) || ""}
                  onChange={(e) =>
                    setStep2({ ...step2, certifications: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>수상이력</Label>
              <Textarea
                value={(step2.awards as string) || ""}
                onChange={(e) =>
                  setStep2({ ...step2, awards: e.target.value })
                }
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 강의 콘텐츠 */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>강의 콘텐츠</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasAssignedSeminar ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 text-yellow-500" />
                <p className="font-medium">세미나가 아직 배정되지 않았습니다</p>
                <p className="text-sm mt-1">
                  운영팀이 세미나를 배정한 후 입력 가능합니다.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label>강의 제목 *</Label>
                  <Input
                    value={(step3.lectureTitle as string) || ""}
                    onChange={(e) =>
                      setStep3({ ...step3, lectureTitle: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>사업 시작 동기</Label>
                  <Textarea
                    value={(step3.businessMotivation as string) || ""}
                    onChange={(e) =>
                      setStep3({ ...step3, businessMotivation: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label>사업 환경과 기회</Label>
                  <Textarea
                    value={(step3.marketEnvironment as string) || ""}
                    onChange={(e) =>
                      setStep3({ ...step3, marketEnvironment: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* 핵심 성공 요인 (동적 3~5개) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>핵심 성공 요인 (3~5개)</Label>
                    {successFactors.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSuccessFactors([...successFactors, ""])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    )}
                  </div>
                  {successFactors.map((factor, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <span className="flex items-center text-sm text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <Input
                        value={factor}
                        onChange={(e) => {
                          const updated = [...successFactors];
                          updated[index] = e.target.value;
                          setSuccessFactors(updated);
                        }}
                        placeholder={`핵심 성공 요인 ${index + 1}`}
                        className="flex-1"
                      />
                      {successFactors.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSuccessFactors(
                              successFactors.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label>비즈니스 모델</Label>
                  <Textarea
                    value={(step3.businessModel as string) || ""}
                    onChange={(e) =>
                      setStep3({ ...step3, businessModel: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label>창업/성장 스토리</Label>
                  <Textarea
                    value={(step3.foundingStory as string) || ""}
                    onChange={(e) =>
                      setStep3({ ...step3, foundingStory: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* 학습 핵심 메시지 (동적 3~5개) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>학습 핵심 메시지 (3~5개)</Label>
                    {keyMessages.length < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setKeyMessages([...keyMessages, ""])}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    )}
                  </div>
                  {keyMessages.map((msg, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <span className="flex items-center text-sm text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <Input
                        value={msg}
                        onChange={(e) => {
                          const updated = [...keyMessages];
                          updated[index] = e.target.value;
                          setKeyMessages(updated);
                        }}
                        placeholder={`핵심 메시지 ${index + 1}`}
                        className="flex-1"
                      />
                      {keyMessages.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setKeyMessages(
                              keyMessages.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <Label>카테고리</Label>
                  <Select
                    value={(step3.category as string) || ""}
                    onValueChange={(v) => setStep3({ ...step3, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: 첨부자료 */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>첨부자료</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 발표자료 */}
            <div>
              <Label>발표자료 (PPT/PDF)</Label>
              {presentationUrl ? (
                <div className="flex items-center gap-2 mt-2 p-3 border rounded-lg">
                  <span className="flex-1 text-sm truncate">{presentationUrl}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPresentationUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-gold-400 transition-colors mt-2"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.ppt,.pptx";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileUpload(file, (url) => setPresentationUrl(url));
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    발표자료 업로드 (PDF, PPT)
                  </p>
                </div>
              )}
            </div>

            {/* 참고문서 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>참고문서</Label>
              </div>
              {attachments.map((att, index) => (
                <div key={index} className="flex items-center gap-2 mb-2 p-2 border rounded">
                  <span className="flex-1 text-sm truncate">{att.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setAttachments(attachments.filter((_, i) => i !== index))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".pdf,.ppt,.pptx,.doc,.docx";
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) {
                      Array.from(files).forEach((file) => {
                        handleFileUpload(file, (url, name) =>
                          setAttachments((prev) => [...prev, { name, url }]),
                        );
                      });
                    }
                  };
                  input.click();
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                참고문서 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 네비게이션 버튼 */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSave(currentStep)}
            disabled={saveStep.isPending}
          >
            {saveStep.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            임시저장
          </Button>
          {currentStep < 4 ? (
            <Button type="button" onClick={goNext} disabled={saveStep.isPending}>
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitPortal.isPending || saveStep.isPending}
            >
              {submitPortal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              최종 제출
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
