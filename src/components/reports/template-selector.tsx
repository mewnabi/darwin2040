"use client";

import { FileText } from "lucide-react";
import { REPORT_TEMPLATES } from "@/constants/survey-labels";
import { cn } from "@/lib/utils";
import type { ReportTemplate } from "@/types";

interface TemplateSelectorProps {
  selected: ReportTemplate | null;
  onSelect: (template: ReportTemplate) => void;
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {REPORT_TEMPLATES.map((tpl) => (
        <button
          key={tpl.value}
          type="button"
          onClick={() => onSelect(tpl.value)}
          className={cn(
            "flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-all",
            selected === tpl.value
              ? "border-navy-500 bg-navy-50 ring-2 ring-navy-200"
              : "hover:border-navy-300 hover:bg-muted/50",
          )}
        >
          <FileText
            className={cn(
              "h-6 w-6",
              selected === tpl.value ? "text-navy-500" : "text-muted-foreground",
            )}
          />
          <h3 className="font-semibold text-sm">{tpl.label}</h3>
          <p className="text-xs text-muted-foreground">{tpl.description}</p>
        </button>
      ))}
    </div>
  );
}
