import Link from "next/link";
import { Calendar, MapPin, Users, Mic2 } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import {
  SEMINAR_STATUS_LABELS,
  SEMINAR_TYPE_LABELS,
} from "@/constants/seminar-types";
import type { Seminar } from "@/types";

interface SeminarCardProps {
  seminar: Seminar;
  href?: string;
}

export function SeminarCard({ seminar, href }: SeminarCardProps) {
  const linkHref = href || `/seminars/${seminar.id}`;
  const activeRegistrations = seminar._count?.registrations ?? 0;
  const remainingSeats = seminar.maxCapacity - activeRegistrations;
  const isFull = remainingSeats <= 0;

  return (
    <Link href={linkHref}>
      <div className="group rounded-lg border bg-card hover:shadow-lg transition-all overflow-hidden h-full flex flex-col">
        {seminar.thumbnailUrl ? (
          <div className="aspect-video bg-muted overflow-hidden relative">
            <img
              src={seminar.thumbnailUrl}
              alt={seminar.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isFull && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">마감</span>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center relative">
            <span className="text-white/60 text-sm">
              {SEMINAR_TYPE_LABELS[seminar.type] || seminar.type}
            </span>
            {isFull && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white font-bold text-lg">마감</span>
              </div>
            )}
          </div>
        )}
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <StatusBadge
              status={seminar.status}
              label={SEMINAR_STATUS_LABELS[seminar.status] || seminar.status}
            />
            <span className="text-xs text-muted-foreground">
              {SEMINAR_TYPE_LABELS[seminar.type]}
            </span>
          </div>
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-navy-500 transition-colors">
            {seminar.title}
          </h3>
          <div className="space-y-1.5 text-xs text-muted-foreground flex-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDateTime(seminar.startAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {seminar.onlineLink
                  ? "온라인"
                  : seminar.venue || "장소 미정"}
              </span>
            </div>
            {seminar.speaker && (
              <div className="flex items-center gap-1.5">
                <Mic2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {seminar.speaker.name}
                  {seminar.speaker.organization &&
                    ` · ${seminar.speaker.organization}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isFull ? (
                  <span className="text-red-500 font-medium">정원 마감</span>
                ) : (
                  <>
                    잔여{" "}
                    <span
                      className={
                        remainingSeats <= 5
                          ? "text-red-500 font-medium"
                          : "text-navy-500 font-medium"
                      }
                    >
                      {remainingSeats}
                    </span>
                    석 / {seminar.maxCapacity}명
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="pt-3 border-t">
            <span className="text-sm font-bold text-gold-600">
              {seminar.basePrice === 0
                ? "무료"
                : formatCurrency(seminar.basePrice)}
            </span>
            {seminar.basePrice > 0 && seminar.vipDiscount > 0 && (
              <span className="text-xs text-muted-foreground ml-2">
                VIP {seminar.vipDiscount}% 할인
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
