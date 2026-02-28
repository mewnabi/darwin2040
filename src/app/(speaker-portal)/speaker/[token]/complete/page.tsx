import { CheckCircle } from "lucide-react";

export default function SpeakerPortalCompletePage() {
  return (
    <div className="rounded-lg border bg-card p-8 text-center">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">제출 완료</h1>
      <p className="text-muted-foreground">
        연사 정보가 성공적으로 제출되었습니다.
        <br />
        담당자가 확인 후 연락드리겠습니다.
      </p>
    </div>
  );
}
