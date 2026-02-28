"use client";

import { useState } from "react";
import { REPORT_PERIOD_OPTIONS } from "@/constants/survey-labels";
import type { ReportPeriod } from "@/types";

interface PeriodSelectorProps {
  onSelect: (from: string, to: string) => void;
}

function getPeriodDates(period: ReportPeriod): { from: string; to: string } | null {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case "quarter": {
      const quarterStart = new Date(year, Math.floor(month / 3) * 3, 1);
      const quarterEnd = new Date(year, Math.floor(month / 3) * 3 + 3, 0);
      return {
        from: quarterStart.toISOString().split("T")[0],
        to: quarterEnd.toISOString().split("T")[0],
      };
    }
    case "half": {
      const halfStart = new Date(year, month < 6 ? 0 : 6, 1);
      const halfEnd = new Date(year, month < 6 ? 6 : 12, 0);
      return {
        from: halfStart.toISOString().split("T")[0],
        to: halfEnd.toISOString().split("T")[0],
      };
    }
    case "annual":
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      };
    default:
      return null;
  }
}

export function PeriodSelector({ onSelect }: PeriodSelectorProps) {
  const [selected, setSelected] = useState<ReportPeriod>("quarter");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const handleSelect = (period: ReportPeriod) => {
    setSelected(period);
    if (period !== "custom") {
      const dates = getPeriodDates(period);
      if (dates) onSelect(dates.from, dates.to);
    }
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onSelect(customFrom, customTo);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {REPORT_PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selected === opt.value
                ? "bg-navy-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selected === "custom" && (
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              시작일
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-md border border-input px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              종료일
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-md border border-input px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomApply}
            disabled={!customFrom || !customTo}
            className="rounded-md bg-navy-500 text-white px-4 py-2 text-sm font-medium hover:bg-navy-600 disabled:opacity-50 transition-colors"
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}
