"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized"
      ? "접근 권한이 없습니다."
      : errorParam === "speaker-token-required"
        ? "연사 포털 접근에는 유효한 토큰이 필요합니다."
        : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = () => {
    signIn("kakao", { callbackUrl: callbackUrl || "/my" });
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          // 역할에 따라 리다이렉트
          const session = await fetch("/api/auth/session").then((r) => r.json());
          const role = session?.user?.role;
          const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];
          router.push(ADMIN_ROLES.includes(role) ? "/admin" : "/my");
        }
        router.refresh();
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <h1 className="text-2xl font-bold">
          <span className="text-navy-500">Darwin</span>{" "}
          <span className="text-gold-500">2040</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          로그인하여 세미나에 참여하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 카카오 로그인 */}
        <Button
          type="button"
          className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] font-medium"
          size="lg"
          onClick={handleKakaoLogin}
        >
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.113 4.508 6.459-.199.742-.72 2.69-.825 3.107-.13.518.19.51.399.371.164-.108 2.612-1.77 3.672-2.489.713.1 1.45.152 2.246.152 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3" />
          </svg>
          카카오로 로그인
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              또는
            </span>
          </div>
        </div>

        {/* 이메일 로그인 (관리자용) */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-navy-500 hover:bg-navy-600"
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/register" className="text-gold-600 hover:underline">
            회원가입
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
