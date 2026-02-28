"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SeminarForm } from "@/components/seminars/seminar-form";

export default function NewSeminarPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/seminars"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          세미나 관리
        </Link>
        <h1 className="text-2xl font-bold">새 세미나 생성</h1>
        <p className="text-sm text-muted-foreground mt-1">
          새 세미나를 초안(DRAFT) 상태로 생성합니다. 생성 후 공개로 전환할 수
          있습니다.
        </p>
      </div>
      <div className="max-w-3xl">
        <SeminarForm />
      </div>
    </div>
  );
}
