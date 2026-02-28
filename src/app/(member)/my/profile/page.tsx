"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Shield } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { MEMBER_TIER_LABELS, MEMBER_TIER_COLORS } from "@/constants/member-tiers";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  profileImage: string | null;
  role: string;
  tier: string;
  businessName: string | null;
  businessType: string | null;
  businessStage: string | null;
  birthYear: number | null;
  gender: string | null;
  region: string | null;
  isYouthFounder: boolean;
  createdAt: string;
}

function useProfile() {
  return useQuery<UserProfile>({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await fetch("/api/members/me/profile");
      if (!res.ok) throw new Error("프로필을 불러올 수 없습니다");
      return res.json();
    },
  });
}

function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/members/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "프로필 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}

const BUSINESS_STAGES = [
  { value: "", label: "선택 안 함" },
  { value: "예비창업", label: "예비창업" },
  { value: "초기", label: "초기 (1~3년)" },
  { value: "성장기", label: "성장기 (3~7년)" },
  { value: "성숙기", label: "성숙기 (7년 이상)" },
];

const GENDERS = [
  { value: "", label: "선택 안 함" },
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
];

const REGIONS = [
  "",
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

export default function ProfilePage() {
  const { toast } = useToast();
  const { data: profile, isLoading, error } = useProfile();
  const updateMutation = useUpdateProfile();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    businessName: "",
    businessType: "",
    businessStage: "",
    birthYear: "",
    gender: "",
    region: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        businessName: profile.businessName || "",
        businessType: profile.businessType || "",
        businessStage: profile.businessStage || "",
        birthYear: profile.birthYear ? String(profile.birthYear) : "",
        gender: profile.gender || "",
        region: profile.region || "",
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "이름을 입력해주세요", variant: "destructive" });
      return;
    }

    updateMutation.mutate(
      {
        name: form.name.trim(),
        phone: form.phone.trim(),
        businessName: form.businessName.trim(),
        businessType: form.businessType.trim(),
        businessStage: form.businessStage,
        birthYear: form.birthYear ? Number(form.birthYear) : null,
        gender: form.gender,
        region: form.region,
      },
      {
        onSuccess: () => {
          toast({ title: "프로필이 수정되었습니다" });
        },
        onError: (err) => {
          toast({ title: err.message, variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">프로필을 불러올 수 없습니다.</p>
        <Link href="/my" className="text-navy-500 hover:underline text-sm">
          마이페이지로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/my"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        마이페이지
      </Link>

      <h1 className="text-2xl font-bold mb-6">내 프로필</h1>

      {/* 회원 등급 카드 */}
      <div className="rounded-xl border bg-card p-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-navy-50 p-2.5">
              <Shield className="h-5 w-5 text-navy-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">회원 등급</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${MEMBER_TIER_COLORS[profile.tier] || "bg-gray-100 text-gray-800"}`}
                >
                  {MEMBER_TIER_LABELS[profile.tier] || profile.tier}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">이메일</p>
            <p className="text-sm font-medium">{profile.email}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          가입일: {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
          {" · "}등급 변경은 관리자에게 문의하세요.
        </p>
      </div>

      {/* 프로필 수정 폼 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
              >
                이름 *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1.5"
              >
                연락처
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="birthYear"
                  className="block text-sm font-medium mb-1.5"
                >
                  출생연도
                </label>
                <input
                  id="birthYear"
                  name="birthYear"
                  type="number"
                  value={form.birthYear}
                  onChange={handleChange}
                  placeholder="예: 1990"
                  min={1940}
                  max={new Date().getFullYear()}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                />
              </div>
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium mb-1.5"
                >
                  성별
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium mb-1.5"
              >
                지역 (시/도)
              </label>
              <select
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              >
                <option value="">선택 안 함</option>
                {REGIONS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 사업 정보 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">사업 정보</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium mb-1.5"
              >
                회사명
              </label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={form.businessName}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
            <div>
              <label
                htmlFor="businessType"
                className="block text-sm font-medium mb-1.5"
              >
                업종
              </label>
              <input
                id="businessType"
                name="businessType"
                type="text"
                value={form.businessType}
                onChange={handleChange}
                placeholder="예: IT/소프트웨어, 제조업, 서비스업"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              />
            </div>
            <div>
              <label
                htmlFor="businessStage"
                className="block text-sm font-medium mb-1.5"
              >
                사업 단계
              </label>
              <select
                id="businessStage"
                name="businessStage"
                value={form.businessStage}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-300"
              >
                {BUSINESS_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 저장 버튼 */}
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy-500 text-white h-12 px-6 font-medium hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          저장
        </button>
      </form>
    </div>
  );
}
