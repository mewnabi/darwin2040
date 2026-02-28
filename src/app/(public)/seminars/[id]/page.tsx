"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Clock,
  Tag,
  ExternalLink,
  Lightbulb,
  GraduationCap,
  Briefcase,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { useSeminar } from "@/hooks/use-seminars";
import { useAuth } from "@/hooks/use-auth";
import { formatDateTime, formatCurrency, cn } from "@/lib/utils";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import { CONTENT_CATEGORIES } from "@/constants/content-categories";
import { StatusBadge } from "@/components/common/status-badge";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import type { Seminar, SeminarSpeaker, SeminarLectureContent } from "@/types";

// ─── Helpers ──────────────────────────────────────

function parseJsonArray(str?: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseCareer(str?: string | null): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return str ? [str] : [];
  }
}

function getCategoryLabel(value?: string | null): string | null {
  if (!value) return null;
  const cat = CONTENT_CATEGORIES.find((c) => c.value === value);
  return cat?.label ?? value;
}

function isEarlyBird(seminar: Seminar): boolean {
  if (!seminar.earlyBirdDays || seminar.earlyBirdDays <= 0) return false;
  const daysUntil = Math.ceil(
    (new Date(seminar.startAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  return daysUntil >= seminar.earlyBirdDays;
}

function calculatePrice(
  basePrice: number,
  discountPercent: number,
  earlyBirdRate: number,
  earlyBird: boolean,
): number {
  let price = basePrice * (1 - discountPercent / 100);
  if (earlyBird) {
    price = price * (1 - earlyBirdRate / 100);
  }
  return Math.round(price);
}

interface PriceTier {
  tier: string;
  label: string;
  price: number;
  discount: number;
  earlyBirdExtra: boolean;
}

function getPriceTiers(seminar: Seminar): PriceTier[] {
  const earlyBird = isEarlyBird(seminar);
  const base = seminar.basePrice;

  if (base === 0) return [];

  return [
    {
      tier: "GUEST",
      label: "게스트 / 준회원",
      price: calculatePrice(base, 0, seminar.earlyBirdRate, earlyBird),
      discount: 0,
      earlyBirdExtra: earlyBird,
    },
    {
      tier: "REGULAR",
      label: "정회원",
      price: calculatePrice(
        base,
        seminar.regularDiscount,
        seminar.earlyBirdRate,
        earlyBird,
      ),
      discount: seminar.regularDiscount,
      earlyBirdExtra: earlyBird,
    },
    {
      tier: "VIP",
      label: "VIP 회원",
      price: calculatePrice(
        base,
        seminar.vipDiscount,
        seminar.earlyBirdRate,
        earlyBird,
      ),
      discount: seminar.vipDiscount,
      earlyBirdExtra: earlyBird,
    },
  ];
}

function tierMatchesUser(
  priceTier: string,
  userTier?: string | null,
): boolean {
  if (!userTier) return false;
  if (priceTier === "GUEST") {
    return userTier === "GUEST" || userTier === "ASSOCIATE";
  }
  return priceTier === userTier;
}

// ─── Sub-components ───────────────────────────────

function SpeakerCard({ speaker }: { speaker: SeminarSpeaker }) {
  const careers = parseCareer(speaker.career);

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-gold-500" />
        연사 소개
      </h3>
      <div className="flex flex-col sm:flex-row gap-5">
        {speaker.profileImageUrl ? (
          <img
            src={speaker.profileImageUrl}
            alt={speaker.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-navy-200 shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-navy-300 to-navy-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {speaker.name.charAt(0)}
          </div>
        )}
        <div className="space-y-2 min-w-0">
          <div>
            <p className="text-lg font-bold text-foreground">{speaker.name}</p>
            {(speaker.title || speaker.organization) && (
              <p className="text-sm text-muted-foreground">
                {[speaker.title, speaker.organization]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          {speaker.education && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{speaker.education}</span>
            </div>
          )}
          {careers.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">주요 경력</p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {careers.slice(0, 5).map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-gold-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {speaker.expertise && speaker.expertise.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {speaker.expertise.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            {speaker.linkedinUrl && (
              <a
                href={speaker.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-navy-500 hover:underline flex items-center gap-1"
              >
                LinkedIn <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {speaker.websiteUrl && (
              <a
                href={speaker.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-navy-500 hover:underline flex items-center gap-1"
              >
                <Globe className="h-3 w-3" /> 웹사이트
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LectureKeyPoints({ content }: { content: SeminarLectureContent }) {
  const keyMessages = parseJsonArray(content.keyMessages);
  const successFactors = parseJsonArray(content.successFactors);

  if (keyMessages.length === 0 && successFactors.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-gold-500" />
        강의 핵심 포인트
      </h3>
      {content.lectureTitle && (
        <p className="text-base font-medium text-foreground mb-4">
          &ldquo;{content.lectureTitle}&rdquo;
        </p>
      )}
      {keyMessages.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-navy-600">핵심 메시지</p>
          <ul className="space-y-2">
            {keyMessages.map((msg, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {successFactors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-navy-600">핵심 성공 요인</p>
          <ul className="space-y-2">
            {successFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-navy-400 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PricingSection({
  seminar,
  userTier,
}: {
  seminar: Seminar;
  userTier?: string | null;
}) {
  const tiers = getPriceTiers(seminar);
  const earlyBird = isEarlyBird(seminar);

  if (seminar.basePrice === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-bold text-foreground mb-3">참가비</h3>
        <p className="text-2xl font-bold text-gold-600">무료</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-1">참가비</h3>
      {earlyBird && (
        <p className="text-xs text-gold-600 font-medium mb-4">
          얼리버드 할인 {seminar.earlyBirdRate}% 적용 중
        </p>
      )}
      <div className="space-y-2">
        {tiers.map((t) => {
          const isUser = tierMatchesUser(t.tier, userTier);
          return (
            <div
              key={t.tier}
              className={cn(
                "flex items-center justify-between gap-3 p-3 rounded-lg",
                isUser
                  ? "bg-gold-50 border-2 border-gold-300"
                  : "bg-muted/50",
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isUser ? "text-gold-700" : "text-foreground",
                    )}
                  >
                    {t.label}
                  </span>
                  {isUser && (
                    <span className="text-[10px] leading-none bg-gold-500 text-white px-1.5 py-1 rounded-full whitespace-nowrap">
                      내 등급
                    </span>
                  )}
                </div>
                {t.discount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.discount}% 할인
                    {t.earlyBirdExtra && ` + 얼리버드 ${seminar.earlyBirdRate}%`}
                  </p>
                )}
                {t.discount === 0 && t.earlyBirdExtra && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    얼리버드 {seminar.earlyBirdRate}% 할인
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "font-bold",
                    isUser ? "text-gold-700 text-lg" : "text-foreground",
                  )}
                >
                  {formatCurrency(t.price)}
                </p>
                {(t.discount > 0 || t.earlyBirdExtra) && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatCurrency(seminar.basePrice)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────

function DetailSkeleton() {
  return (
    <div className="container py-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-6" />
      <div className="h-64 bg-muted rounded-xl mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────

export default function SeminarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: seminar, isLoading, error } = useSeminar(params.id);
  const { isAuthenticated, tier } = useAuth();

  const activeRegistrations = seminar?._count?.registrations ?? 0;
  const remainingSeats = seminar
    ? seminar.maxCapacity - activeRegistrations
    : 0;
  const isFull = remainingSeats <= 0;
  const canRegister =
    seminar?.status === "PUBLISHED" || seminar?.status === "CLOSED";

  const durationMinutes = useMemo(() => {
    if (!seminar) return 0;
    return Math.round(
      (new Date(seminar.endAt).getTime() -
        new Date(seminar.startAt).getTime()) /
        (1000 * 60),
    );
  }, [seminar]);

  if (isLoading) return <DetailSkeleton />;

  if (error || !seminar) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          세미나를 찾을 수 없습니다.
        </p>
        <Link
          href="/"
          className="text-sm text-navy-500 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const categoryLabel = getCategoryLabel(seminar.category);

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 세미나 목록
        </Link>
      </nav>

      {/* Hero Image */}
      {seminar.thumbnailUrl ? (
        <div className="aspect-[21/9] rounded-xl overflow-hidden mb-8">
          <img
            src={seminar.thumbnailUrl}
            alt={seminar.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[21/9] rounded-xl bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center mb-8">
          <span className="text-white/40 text-xl font-medium">
            {SEMINAR_TYPE_LABELS[seminar.type]}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Meta */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={seminar.status} label={seminar.status === "PUBLISHED" ? "신청 가능" : "마감"} />
              <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-600">
                {SEMINAR_TYPE_LABELS[seminar.type]}
              </span>
              {categoryLabel && (
                <span className="inline-flex items-center rounded-full bg-gold-50 px-2.5 py-0.5 text-xs font-medium text-gold-700">
                  <Tag className="h-3 w-3 mr-1" />
                  {categoryLabel}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {seminar.title}
            </h1>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-navy-400" />
                <span>{formatDateTime(seminar.startAt)}</span>
              </div>
              {durationMinutes > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-navy-400" />
                  <span>
                    {durationMinutes >= 60
                      ? `${Math.floor(durationMinutes / 60)}시간 ${durationMinutes % 60 ? `${durationMinutes % 60}분` : ""}`
                      : `${durationMinutes}분`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-navy-400" />
                <span>
                  {seminar.onlineLink
                    ? "온라인"
                    : seminar.venue || "장소 미정"}
                  {seminar.venueAddress && ` (${seminar.venueAddress})`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-navy-400" />
                <span>
                  정원 {seminar.maxCapacity}명 (잔여{" "}
                  <span
                    className={cn(
                      "font-medium",
                      isFull
                        ? "text-red-500"
                        : remainingSeats <= 5
                          ? "text-red-500"
                          : "text-navy-500",
                    )}
                  >
                    {isFull ? 0 : remainingSeats}
                  </span>
                  석)
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {seminar.description && (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-3">
                세미나 소개
              </h3>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {seminar.description}
              </div>
            </div>
          )}

          {/* Speaker Card */}
          {seminar.speaker && <SpeakerCard speaker={seminar.speaker} />}

          {/* Lecture Key Points */}
          {seminar.lectureContent && (
            <LectureKeyPoints content={seminar.lectureContent} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <PricingSection seminar={seminar} userTier={tier} />

          {/* CTA */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            {/* Remaining Seats */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">잔여석</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  isFull
                    ? "text-red-500"
                    : remainingSeats <= 5
                      ? "text-red-500"
                      : "text-navy-500",
                )}
              >
                {isFull ? 0 : remainingSeats}
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / {seminar.maxCapacity}
                </span>
              </p>
              {/* Progress bar */}
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isFull
                      ? "bg-red-500"
                      : remainingSeats <= 5
                        ? "bg-red-400"
                        : "bg-navy-500",
                  )}
                  style={{
                    width: `${Math.min((activeRegistrations / seminar.maxCapacity) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Register Button */}
            {canRegister && (
              <>
                {isAuthenticated ? (
                  <Link
                    href={`/seminars/${seminar.id}/register`}
                    className={cn(
                      "block w-full text-center py-3 rounded-lg font-medium text-sm transition-colors",
                      isFull
                        ? "bg-navy-100 text-navy-600 hover:bg-navy-200"
                        : "bg-gold-500 text-navy-900 hover:bg-gold-400",
                    )}
                  >
                    {isFull ? "대기 신청하기" : "신청하기"}
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href={`/login?callbackUrl=/seminars/${seminar.id}`}
                      className="block w-full text-center py-3 rounded-lg bg-gold-500 text-navy-900 font-medium text-sm hover:bg-gold-400 transition-colors"
                    >
                      로그인하고 신청하기
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      세미나 신청은 로그인이 필요합니다
                    </p>
                  </div>
                )}
              </>
            )}

            {seminar.status === "COMPLETED" && (
              <p className="text-sm text-center text-muted-foreground">
                이미 완료된 세미나입니다.
              </p>
            )}
            {seminar.status === "CANCELLED" && (
              <p className="text-sm text-center text-red-500">
                취소된 세미나입니다.
              </p>
            )}
          </div>

          {/* Online Link Info */}
          {seminar.onlineLink && (
            <div className="rounded-xl border bg-card p-6">
              <h3 className="text-sm font-bold text-foreground mb-2">
                온라인 참여
              </h3>
              <p className="text-xs text-muted-foreground">
                신청 완료 후 온라인 참여 링크가 안내됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
