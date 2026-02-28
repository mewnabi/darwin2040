"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SpeakerForm } from "@/components/speakers/speaker-form";

export default function NewSpeakerPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/speakers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          연사 관리
        </Link>
        <h1 className="text-2xl font-bold">연사 등록</h1>
        <p className="text-sm text-muted-foreground mt-1">
          새 연사를 후보(CANDIDATE) 상태로 등록합니다.
        </p>
      </div>
      <div className="max-w-3xl">
        <SpeakerForm />
      </div>
    </div>
  );
}
