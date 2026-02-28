import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.kakao_account?.profile?.nickname ?? null,
          email: profile.kakao_account?.email ?? null,
          image:
            profile.kakao_account?.profile?.profile_image_url ?? null,
          role: "MEMBER" as const,
          tier: "ASSOCIATE" as const,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profileImage,
          role: user.role,
          tier: user.tier,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // 카카오 로그인: 기존 사용자 찾거나 새 사용자 생성
      if (account?.provider === "kakao" && profile) {
        const kakaoProfile = profile as {
          id: number;
          kakao_account?: {
            email?: string;
            profile?: {
              nickname?: string;
              profile_image_url?: string;
            };
          };
        };

        const kakaoId = kakaoProfile.id.toString();
        const email = kakaoProfile.kakao_account?.email;
        const name =
          kakaoProfile.kakao_account?.profile?.nickname ?? "카카오 사용자";
        const profileImage =
          kakaoProfile.kakao_account?.profile?.profile_image_url;

        // kakaoId로 기존 사용자 찾기
        let existingUser = await prisma.user.findUnique({
          where: { kakaoId },
        });

        // kakaoId 없으면 이메일로 찾기
        if (!existingUser && email) {
          existingUser = await prisma.user.findUnique({
            where: { email },
          });

          // 이메일로 찾았으면 kakaoId 연결
          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { kakaoId, profileImage: profileImage ?? existingUser.profileImage },
            });
          }
        }

        // 완전히 새로운 사용자
        if (!existingUser) {
          if (!email) {
            // 카카오에서 이메일을 제공하지 않는 경우 kakaoId 기반 이메일 생성
            existingUser = await prisma.user.create({
              data: {
                email: `kakao_${kakaoId}@darwin2040.local`,
                name,
                kakaoId,
                profileImage,
                role: "MEMBER",
                tier: "ASSOCIATE",
              },
            });
          } else {
            existingUser = await prisma.user.create({
              data: {
                email,
                name,
                kakaoId,
                profileImage,
                role: "MEMBER",
                tier: "ASSOCIATE",
              },
            });
          }
        }

        // Account 레코드 upsert (PrismaAdapter가 처리 못하는 케이스 대비)
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
          },
          create: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });

        // user 객체에 DB 사용자 정보 반영 (jwt 콜백에서 사용)
        user.id = existingUser.id;
        user.role = existingUser.role;
        user.tier = existingUser.tier;

        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tier = user.tier;
      }

      // session update 시 (useSession의 update() 호출 시)
      if (trigger === "update" && session) {
        token.role = session.role;
        token.tier = session.tier;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tier = token.tier;
      }
      return session;
    },
  },
};
