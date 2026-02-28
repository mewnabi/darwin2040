"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/common/file-upload";
import { EXPERTISE_TAGS } from "@/constants/speaker-status";
import { useCreateSpeaker, useUpdateSpeaker } from "@/hooks/use-speakers";
import { useToast } from "@/hooks/use-toast";
import type { Speaker } from "@/types";

const speakerSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일을 입력해주세요").optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  organization: z.string().optional(),
  education: z.string().optional(),
  career: z.string().optional(),
  linkedinUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof speakerSchema>;

interface SpeakerFormProps {
  speaker?: Speaker;
}

export function SpeakerForm({ speaker }: SpeakerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createSpeaker = useCreateSpeaker();
  const updateSpeaker = useUpdateSpeaker(speaker?.id ?? "");

  const [expertise, setExpertise] = useState<string[]>(speaker?.expertise ?? []);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(
    speaker?.profileImageUrl ?? null,
  );
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      name: speaker?.name ?? "",
      email: speaker?.email ?? "",
      phone: speaker?.phone ?? "",
      title: speaker?.title ?? "",
      organization: speaker?.organization ?? "",
      education: speaker?.education ?? "",
      career: speaker?.career ?? "",
      linkedinUrl: speaker?.linkedinUrl ?? "",
      youtubeUrl: speaker?.youtubeUrl ?? "",
      instagramUrl: speaker?.instagramUrl ?? "",
      websiteUrl: speaker?.websiteUrl ?? "",
      notes: speaker?.notes ?? "",
    },
  });

  const toggleExpertise = (tag: string) => {
    setExpertise((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

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
      setProfileImageUrl(url);
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
      ...data,
      email: data.email || undefined,
      expertise,
      profileImageUrl: profileImageUrl || undefined,
    };

    try {
      if (speaker) {
        await updateSpeaker.mutateAsync(payload);
        toast({ title: "연사 정보가 수정되었습니다" });
      } else {
        await createSpeaker.mutateAsync(payload);
        toast({ title: "연사가 등록되었습니다" });
        router.push("/admin/speakers");
      }
    } catch (err) {
      toast({
        title: speaker ? "수정 실패" : "등록 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  const isPending = isSubmitting || createSpeaker.isPending || updateSpeaker.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input id="name" placeholder="연사 이름" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input id="email" type="email" placeholder="email@example.com" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">연락처</Label>
              <Input id="phone" placeholder="010-0000-0000" {...register("phone")} />
            </div>
            <div>
              <Label htmlFor="organization">소속</Label>
              <Input id="organization" placeholder="회사/기관명" {...register("organization")} />
            </div>
          </div>
          <div>
            <Label htmlFor="title">직함</Label>
            <Input id="title" placeholder="대표이사, CEO 등" {...register("title")} />
          </div>
          {/* 프로필 이미지 */}
          <div>
            <Label>프로필 이미지</Label>
            {profileImageUrl ? (
              <div className="relative inline-block mt-2">
                <img
                  src={profileImageUrl}
                  alt="프로필"
                  className="h-24 w-24 rounded-full object-cover border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-1 -right-1 h-6 w-6"
                  onClick={() => setProfileImageUrl(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <FileUpload
                  label={uploading ? "업로드 중..." : "프로필 사진 업로드"}
                  accept="image/jpeg,image/png,image/webp"
                  onFileSelect={handleFileUpload}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 경력/학력 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">경력 / 학력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="education">학력</Label>
            <Input id="education" placeholder="대학교/전공" {...register("education")} />
          </div>
          <div>
            <Label htmlFor="career">주요 경력</Label>
            <Textarea
              id="career"
              placeholder="주요 경력을 입력해주세요 (줄바꿈으로 구분)"
              rows={4}
              {...register("career")}
            />
          </div>
        </CardContent>
      </Card>

      {/* 전문 분야 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전문 분야</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {EXPERTISE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleExpertise(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  expertise.includes(tag)
                    ? "bg-navy-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SNS / 링크 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SNS / 링크</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input id="linkedinUrl" placeholder="https://linkedin.com/in/..." {...register("linkedinUrl")} />
            </div>
            <div>
              <Label htmlFor="youtubeUrl">YouTube</Label>
              <Input id="youtubeUrl" placeholder="https://youtube.com/..." {...register("youtubeUrl")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input id="instagramUrl" placeholder="https://instagram.com/..." {...register("instagramUrl")} />
            </div>
            <div>
              <Label htmlFor="websiteUrl">웹사이트</Label>
              <Input id="websiteUrl" placeholder="https://..." {...register("websiteUrl")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내부 메모 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">내부 메모</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            placeholder="운영팀 내부 메모 (연사에게는 공개되지 않습니다)"
            rows={3}
            {...register("notes")}
          />
        </CardContent>
      </Card>

      {/* 버튼 */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/speakers")}
        >
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {speaker ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </form>
  );
}
