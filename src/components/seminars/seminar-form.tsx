"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { FileUpload } from "@/components/common/file-upload";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import { CONTENT_CATEGORIES } from "@/constants/content-categories";
import { useCreateSeminar, useUpdateSeminar } from "@/hooks/use-seminars";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Search } from "lucide-react";
import type { Seminar } from "@/types";

const seminarSchema = z
  .object({
    title: z.string().min(1, "제목을 입력해주세요"),
    description: z.string().optional(),
    type: z.enum(["MAIN_GAME", "SPINUP_GAME", "SPECIAL"]),
    startDate: z.string().min(1, "시작 날짜를 선택해주세요"),
    startTime: z.string().min(1, "시작 시간을 입력해주세요"),
    endDate: z.string().min(1, "종료 날짜를 선택해주세요"),
    endTime: z.string().min(1, "종료 시간을 입력해주세요"),
    venue: z.string().optional(),
    venueAddress: z.string().optional(),
    onlineLink: z.string().optional(),
    maxCapacity: z.number().int().min(1, "최소 1명 이상"),
    basePrice: z.number().int().min(0, "0 이상 입력"),
    regularDiscount: z.number().int().min(0).max(100),
    vipDiscount: z.number().int().min(0).max(100),
    earlyBirdDays: z.number().int().min(0),
    earlyBirdRate: z.number().int().min(0).max(100),
    category: z.string().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(`${data.startDate}T${data.startTime}`);
      const end = new Date(`${data.endDate}T${data.endTime}`);
      return end > start;
    },
    { message: "종료 일시는 시작 일시보다 이후여야 합니다", path: ["endTime"] },
  );

type FormValues = z.infer<typeof seminarSchema>;

interface SpeakerOption {
  id: string;
  name: string;
  organization?: string | null;
  title?: string | null;
  profileImageUrl?: string | null;
}

interface SeminarFormProps {
  seminar?: Seminar;
}

export function SeminarForm({ seminar }: SeminarFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createSeminar = useCreateSeminar();
  const updateSeminar = useUpdateSeminar(seminar?.id ?? "");

  const [speakerId, setSpeakerId] = useState<string | null>(
    seminar?.speakerId ?? null,
  );
  const [selectedSpeaker, setSelectedSpeaker] =
    useState<SpeakerOption | null>(seminar?.speaker ?? null);
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [speakerResults, setSpeakerResults] = useState<SpeakerOption[]>([]);
  const [showSpeakerSearch, setShowSpeakerSearch] = useState(false);
  const [searchingPeakers, setSearchingSpeakers] = useState(false);

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    seminar?.thumbnailUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);

  const defaultValues: Partial<FormValues> = seminar
    ? {
        title: seminar.title,
        description: seminar.description ?? "",
        type: seminar.type,
        startDate: new Date(seminar.startAt).toISOString().split("T")[0],
        startTime: new Date(seminar.startAt).toTimeString().slice(0, 5),
        endDate: new Date(seminar.endAt).toISOString().split("T")[0],
        endTime: new Date(seminar.endAt).toTimeString().slice(0, 5),
        venue: seminar.venue ?? "",
        venueAddress: seminar.venueAddress ?? "",
        onlineLink: seminar.onlineLink ?? "",
        maxCapacity: seminar.maxCapacity,
        basePrice: seminar.basePrice,
        regularDiscount: seminar.regularDiscount,
        vipDiscount: seminar.vipDiscount,
        earlyBirdDays: seminar.earlyBirdDays,
        earlyBirdRate: seminar.earlyBirdRate,
        category: seminar.category ?? "",
      }
    : {
        type: "MAIN_GAME",
        maxCapacity: 30,
        basePrice: 0,
        regularDiscount: 20,
        vipDiscount: 40,
        earlyBirdDays: 7,
        earlyBirdRate: 10,
      };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(seminarSchema),
    defaultValues,
  });

  const watchType = watch("type");

  // 연사 검색
  useEffect(() => {
    if (!speakerSearch.trim()) {
      setSpeakerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingSpeakers(true);
      try {
        const res = await fetch(
          `/api/speakers?search=${encodeURIComponent(speakerSearch)}`,
        );
        if (res.ok) {
          setSpeakerResults(await res.json());
        }
      } finally {
        setSearchingSpeakers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [speakerSearch]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const { url } = await res.json();
      setThumbnailUrl(url);
      toast({ title: "이미지가 업로드되었습니다" });
    } catch (err) {
      toast({
        title: "업로드 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      type: data.type,
      startAt: new Date(`${data.startDate}T${data.startTime}`).toISOString(),
      endAt: new Date(`${data.endDate}T${data.endTime}`).toISOString(),
      venue: data.venue || undefined,
      venueAddress: data.venueAddress || undefined,
      onlineLink: data.onlineLink || undefined,
      maxCapacity: data.maxCapacity,
      basePrice: data.basePrice,
      regularDiscount: data.regularDiscount,
      vipDiscount: data.vipDiscount,
      earlyBirdDays: data.earlyBirdDays,
      earlyBirdRate: data.earlyBirdRate,
      speakerId: speakerId,
      category: data.category || undefined,
      thumbnailUrl: thumbnailUrl || undefined,
    };

    try {
      if (seminar) {
        await updateSeminar.mutateAsync(payload);
        toast({ title: "세미나가 수정되었습니다" });
      } else {
        await createSeminar.mutateAsync(payload);
        toast({ title: "세미나가 생성되었습니다" });
      }
      router.push("/admin/seminars");
    } catch (err) {
      toast({
        title: seminar ? "수정 실패" : "생성 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  const isPending = isSubmitting || createSeminar.isPending || updateSeminar.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              placeholder="세미나 제목을 입력하세요"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="세미나 설명을 입력하세요"
              rows={4}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>유형 *</Label>
              <Select
                value={watchType}
                onValueChange={(v) =>
                  setValue("type", v as FormValues["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SEMINAR_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>카테고리</Label>
              <Select
                value={watch("category") ?? ""}
                onValueChange={(v) => setValue("category", v)}
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
          </div>
        </CardContent>
      </Card>

      {/* 일정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">일정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">시작 날짜 *</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-destructive mt-1">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="startTime">시작 시간 *</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && (
                <p className="text-sm text-destructive mt-1">
                  {errors.startTime.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endDate">종료 날짜 *</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-sm text-destructive mt-1">
                  {errors.endDate.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endTime">종료 시간 *</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              {errors.endTime && (
                <p className="text-sm text-destructive mt-1">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 장소 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">장소</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="venue">장소명</Label>
            <Input
              id="venue"
              placeholder="예: 서울 강남 코엑스 컨퍼런스룸 A"
              {...register("venue")}
            />
          </div>
          <div>
            <Label htmlFor="venueAddress">주소</Label>
            <Input
              id="venueAddress"
              placeholder="상세 주소를 입력하세요"
              {...register("venueAddress")}
            />
          </div>
          <div>
            <Label htmlFor="onlineLink">온라인 참여 링크</Label>
            <Input
              id="onlineLink"
              placeholder="Zoom/Meet 링크 (온라인 세미나인 경우)"
              {...register("onlineLink")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 정원 및 가격 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">정원 및 가격</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxCapacity">정원 *</Label>
              <Input
                id="maxCapacity"
                type="number"
                min={1}
                {...register("maxCapacity", { valueAsNumber: true })}
              />
              {errors.maxCapacity && (
                <p className="text-sm text-destructive mt-1">
                  {errors.maxCapacity.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="basePrice">기본가 (원) *</Label>
              <Input
                id="basePrice"
                type="number"
                min={0}
                step={1000}
                {...register("basePrice", { valueAsNumber: true })}
              />
              {errors.basePrice && (
                <p className="text-sm text-destructive mt-1">
                  {errors.basePrice.message}
                </p>
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              등급별 할인율
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="regularDiscount">정회원 할인율 (%)</Label>
                <Input
                  id="regularDiscount"
                  type="number"
                  min={0}
                  max={100}
                  {...register("regularDiscount", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="vipDiscount">VIP 할인율 (%)</Label>
                <Input
                  id="vipDiscount"
                  type="number"
                  min={0}
                  max={100}
                  {...register("vipDiscount", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              얼리버드 설정
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="earlyBirdDays">
                  얼리버드 기준 (일 전까지)
                </Label>
                <Input
                  id="earlyBirdDays"
                  type="number"
                  min={0}
                  {...register("earlyBirdDays", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="earlyBirdRate">얼리버드 할인율 (%)</Label>
                <Input
                  id="earlyBirdRate"
                  type="number"
                  min={0}
                  max={100}
                  {...register("earlyBirdRate", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 연사 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">연사</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSpeaker ? (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="h-10 w-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-medium">
                {selectedSpeaker.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedSpeaker.name}</p>
                <p className="text-sm text-muted-foreground">
                  {[selectedSpeaker.organization, selectedSpeaker.title]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSpeakerId(null);
                  setSelectedSpeaker(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="연사 이름 또는 소속으로 검색..."
                  className="pl-10"
                  value={speakerSearch}
                  onChange={(e) => {
                    setSpeakerSearch(e.target.value);
                    setShowSpeakerSearch(true);
                  }}
                  onFocus={() => setShowSpeakerSearch(true)}
                />
              </div>

              {showSpeakerSearch && speakerSearch.trim() && (
                <div className="absolute z-10 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-60 overflow-y-auto">
                  {searchingPeakers ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      검색 중...
                    </div>
                  ) : speakerResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      검색 결과가 없습니다
                    </div>
                  ) : (
                    speakerResults.map((speaker) => (
                      <button
                        key={speaker.id}
                        type="button"
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                        onClick={() => {
                          setSpeakerId(speaker.id);
                          setSelectedSpeaker(speaker);
                          setSpeakerSearch("");
                          setShowSpeakerSearch(false);
                        }}
                      >
                        <div className="h-8 w-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 text-sm font-medium">
                          {speaker.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{speaker.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[speaker.organization, speaker.title]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 대표 이미지 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">대표 이미지</CardTitle>
        </CardHeader>
        <CardContent>
          {thumbnailUrl ? (
            <div className="relative">
              <img
                src={thumbnailUrl}
                alt="세미나 대표 이미지"
                className="w-full max-w-md rounded-lg border object-cover aspect-video"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setThumbnailUrl(null)}
              >
                <X className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>
          ) : (
            <FileUpload
              label={
                uploading
                  ? "업로드 중..."
                  : "세미나 대표 이미지 업로드 (JPG, PNG, WebP)"
              }
              accept="image/jpeg,image/png,image/webp,image/gif"
              onFileSelect={handleFileUpload}
            />
          )}
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/seminars")}
        >
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {seminar ? "수정하기" : "생성하기"}
        </Button>
      </div>
    </form>
  );
}
