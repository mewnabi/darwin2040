"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCheckin } from "@/hooks/use-attendance";
import { useSeminar } from "@/hooks/use-seminars";
import { formatDateTime } from "@/lib/utils";

type CheckinState =
  | { status: "loading" }
  | { status: "success"; name: string; time: string }
  | { status: "error"; message: string; code: string };

export default function CheckinPage({
  params,
}: {
  params: { id: string };
}) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { data: seminar } = useSeminar(params.id);
  const checkin = useCheckin(params.id);
  const [state, setState] = useState<CheckinState>({ status: "loading" });

  useEffect(() => {
    if (!code) {
      setState({
        status: "error",
        message: "QR 코드가 유효하지 않습니다.",
        code: "INVALID_CODE",
      });
      return;
    }

    checkin
      .mutateAsync({ code })
      .then((result) => {
        setState({
          status: "success",
          name: result.attendance.user.name,
          time: result.attendance.checkedInAt,
        });
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "체크인에 실패했습니다";
        let errorCode = "UNKNOWN";
        if (message.includes("로그인")) errorCode = "NOT_LOGGED_IN";
        else if (message.includes("신청")) errorCode = "NO_REGISTRATION";
        else if (message.includes("결제")) errorCode = "NOT_PAID";
        else if (message.includes("유효 시간")) errorCode = "EXPIRED";
        else if (message.includes("이미")) errorCode = "ALREADY_CHECKED_IN";
        else if (message.includes("유효하지")) errorCode = "INVALID_CODE";

        setState({ status: "error", message, code: errorCode });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          {state.status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-[#1B2A4A] mx-auto" />
              <p className="text-lg font-medium">체크인 처리 중...</p>
            </div>
          )}

          {state.status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-green-700">
                체크인 완료!
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="text-lg font-medium text-foreground">
                  {state.name}님
                </p>
                {seminar && (
                  <p className="text-sm">{seminar.title}</p>
                )}
                <p className="text-sm">
                  체크인 시간: {formatDateTime(state.time)}
                </p>
              </div>
            </div>
          )}

          {state.status === "error" && (
            <div className="space-y-4">
              <AlertCircle className="h-20 w-20 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold text-red-700">
                체크인 실패
              </h2>
              <p className="text-muted-foreground">{state.message}</p>

              {state.code === "NOT_LOGGED_IN" && (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/member/seminars/${params.id}/checkin?code=${code}`)}`}
                >
                  <Button className="mt-2">
                    <LogIn className="h-4 w-4 mr-2" />
                    로그인하기
                  </Button>
                </Link>
              )}

              {state.code === "ALREADY_CHECKED_IN" && (
                <div className="mt-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700">
                    이미 출석이 완료되었습니다.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8">
            <Link href="/member">
              <Button variant="outline" size="sm">
                마이페이지로 이동
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
