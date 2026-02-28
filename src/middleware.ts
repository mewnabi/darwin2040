import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // (admin)/* → 관리자 역할만
    if (pathname.startsWith("/admin")) {
      if (!token || !ADMIN_ROLES.includes(token.role)) {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    // (member)/* → 로그인 사용자만 (withAuth가 자동 처리하지만 명시적으로)
    if (pathname.startsWith("/member") || pathname.startsWith("/my")) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // 세미나 신청 페이지 → 로그인 필수
    if (pathname.match(/^\/seminars\/[^/]+\/register/)) {
      if (!token) {
        return NextResponse.redirect(
          new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
        );
      }
    }

    // (speaker-portal)/* → 유효한 토큰 파라미터 필요
    if (pathname.startsWith("/speaker-portal")) {
      const portalToken = req.nextUrl.searchParams.get("token");
      if (!portalToken) {
        return NextResponse.redirect(
          new URL("/login?error=speaker-token-required", req.url)
        );
      }
      // 토큰 유효성은 페이지에서 서버 사이드로 검증
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // speaker-portal은 토큰 파라미터로 인증 → NextAuth 세션 불필요
        if (pathname.startsWith("/speaker-portal")) {
          return true;
        }

        // admin, member, my 경로는 로그인 필수
        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/member") ||
          pathname.startsWith("/my")
        ) {
          return !!token;
        }

        // 세미나 신청 페이지는 로그인 필수
        if (pathname.match(/^\/seminars\/[^/]+\/register/)) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/member/:path*",
    "/my/:path*",
    "/speaker-portal/:path*",
    "/seminars/:path*/register",
  ],
};
