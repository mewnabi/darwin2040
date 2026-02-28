"use client";

import { cn } from "@/lib/utils";

interface NpsInputProps {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

function getNpsColor(score: number, isSelected: boolean) {
  if (!isSelected) return "bg-gray-100 text-gray-500 hover:bg-gray-200";
  if (score <= 6) return "bg-red-500 text-white";
  if (score <= 8) return "bg-yellow-500 text-white";
  return "bg-green-500 text-white";
}

export function NpsInput({ value, onChange, readonly = false }: NpsInputProps) {
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => (
          <button
            key={score}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(score)}
            className={cn(
              "w-9 h-9 rounded-md text-sm font-medium transition-all",
              readonly ? "cursor-default" : "cursor-pointer",
              getNpsColor(score, value === score),
            )}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground px-1">
        <span>전혀 추천하지 않음</span>
        <span>매우 추천함</span>
      </div>
    </div>
  );
}
