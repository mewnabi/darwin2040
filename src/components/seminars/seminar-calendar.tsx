"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SEMINAR_TYPE_LABELS,
  SEMINAR_STATUS_LABELS,
} from "@/constants/seminar-types";
import { cn } from "@/lib/utils";
import type { Seminar } from "@/types";

interface SeminarCalendarProps {
  seminars: Seminar[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const TYPE_DOT_COLORS: Record<string, string> = {
  MAIN_GAME: "bg-navy-500",
  SPINUP_GAME: "bg-gold-500",
  SPECIAL: "bg-purple-500",
};

export function SeminarCalendar({ seminars }: SeminarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const seminarsByDate = useMemo(() => {
    const map = new Map<string, Seminar[]>();
    for (const seminar of seminars) {
      const dateKey = new Date(seminar.startAt).toISOString().split("T")[0];
      const existing = map.get(dateKey) || [];
      existing.push(seminar);
      map.set(dateKey, existing);
    }
    return map;
  }, [seminars]);

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center">
            {year}년 {month + 1}월
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday}>
          오늘
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-xs font-medium text-muted-foreground",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500",
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return (
              <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r p-1 bg-muted/20" />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const daySeminars = seminarsByDate.get(dateKey) || [];
          const isToday = dateKey === todayKey;
          const dayOfWeek = (startOffset + day - 1) % 7;

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[100px] border-b border-r p-1",
                isToday && "bg-blue-50",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    isToday && "bg-navy-500 text-white",
                    dayOfWeek === 0 && !isToday && "text-red-500",
                    dayOfWeek === 6 && !isToday && "text-blue-500",
                  )}
                >
                  {day}
                </span>
                {daySeminars.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {daySeminars.length}건
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {daySeminars.slice(0, 3).map((seminar) => (
                  <Link
                    key={seminar.id}
                    href={`/admin/seminars/${seminar.id}`}
                    className="block"
                  >
                    <div
                      className={cn(
                        "text-[10px] leading-tight px-1 py-0.5 rounded truncate hover:opacity-80 transition-opacity",
                        TYPE_DOT_COLORS[seminar.type]
                          ? `${TYPE_DOT_COLORS[seminar.type]} text-white`
                          : "bg-gray-200 text-gray-800",
                      )}
                      title={`${seminar.title} (${SEMINAR_TYPE_LABELS[seminar.type]} / ${SEMINAR_STATUS_LABELS[seminar.status]})`}
                    >
                      {seminar.title}
                    </div>
                  </Link>
                ))}
                {daySeminars.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">
                    +{daySeminars.length - 3}개 더
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t text-xs text-muted-foreground">
        {Object.entries(TYPE_DOT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <span className={cn("w-2.5 h-2.5 rounded-sm", color)} />
            <span>{SEMINAR_TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
