"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  Maximize,
  RefreshCw,
  Users,
  CheckCircle,
  Percent,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSeminar } from "@/hooks/use-seminars";
import {
  useGenerateQR,
  useAttendanceList,
  useManualCheckin,
} from "@/hooks/use-attendance";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";
import { MEMBER_TIER_LABELS } from "@/constants/member-tiers";

type FilterType = "all" | "checked" | "unchecked";

export default function AttendancePage({
  params,
}: {
  params: { id: string };
}) {
  const { toast } = useToast();
  const { data: seminar, isLoading: seminarLoading } = useSeminar(params.id);
  const { data: attendanceData, isLoading: attendanceLoading } =
    useAttendanceList(params.id);
  const generateQR = useGenerateQR(params.id);
  const manualCheckin = useManualCheckin(params.id);

  const [qrData, setQrData] = useState<{
    qrImageDataUrl: string;
    qrUrl: string;
    validFrom: string;
    validUntil: string;
  } | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [manualDialog, setManualDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });
  const [manualMemo, setManualMemo] = useState("");
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleGenerateQR = useCallback(
    async (regenerate = false) => {
      try {
        const data = await generateQR.mutateAsync({ regenerate });
        setQrData(data);
        toast({
          title: regenerate
            ? "QR 코드가 재생성되었습니다"
            : "QR 코드가 생성되었습니다",
        });
      } catch (err) {
        toast({
          title: "QR 코드 생성 실패",
          description:
            err instanceof Error ? err.message : "다시 시도해주세요",
          variant: "destructive",
        });
      }
    },
    [generateQR, toast],
  );

  const handleFullscreen = useCallback(() => {
    if (qrContainerRef.current) {
      qrContainerRef.current.requestFullscreen?.();
    }
  }, []);

  const handleManualCheckin = useCallback(async () => {
    try {
      await manualCheckin.mutateAsync({
        userId: manualDialog.userId,
        memo: manualMemo || undefined,
      });
      toast({ title: `${manualDialog.userName}님 수동 체크인 완료` });
      setManualDialog({ open: false, userId: "", userName: "" });
      setManualMemo("");
    } catch (err) {
      toast({
        title: "수동 체크인 실패",
        description:
          err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  }, [manualCheckin, manualDialog, manualMemo, toast]);

  if (seminarLoading || attendanceLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">
          세미나를 찾을 수 없습니다.
        </p>
        <Link href="/admin/seminars">
          <Button variant="outline">목록으로</Button>
        </Link>
      </div>
    );
  }

  const stats = attendanceData?.stats ?? { total: 0, checkedIn: 0, rate: 0 };
  const registrations = attendanceData?.registrations ?? [];

  const filtered = registrations.filter((r) => {
    if (filter === "checked") return r.attendance != null;
    if (filter === "unchecked") return r.attendance == null;
    return true;
  });

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/admin/seminars/${params.id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          세미나 상세
        </Link>
        <h1 className="text-2xl font-bold">{seminar.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDateTime(seminar.startAt)} ~ {formatDateTime(seminar.endAt)}
        </p>
      </div>

      {/* QR 코드 영역 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR 출석 체크
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!qrData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                QR 코드를 생성하여 프로젝터에 표시하세요.
                <br />
                회원들이 스마트폰으로 스캔하여 출석 체크합니다.
              </p>
              <Button
                onClick={() => handleGenerateQR(false)}
                disabled={generateQR.isPending}
              >
                {generateQR.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                <QrCode className="h-4 w-4 mr-2" />
                QR 코드 생성
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* QR 이미지 (전체화면 대상) */}
              <div
                ref={qrContainerRef}
                className="bg-white p-8 rounded-lg flex flex-col items-center gap-4 fullscreen:p-20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrData.qrImageDataUrl}
                  alt="세미나 출석 QR 코드"
                  className="w-64 h-64 fullscreen:w-[400px] fullscreen:h-[400px]"
                />
                <p className="text-lg font-semibold text-[#1B2A4A] fullscreen:text-3xl">
                  {seminar.title}
                </p>
                <p className="text-sm text-gray-500 fullscreen:text-xl">
                  스마트폰으로 QR 코드를 스캔하세요
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                유효 시간: {formatDateTime(qrData.validFrom)} ~{" "}
                {formatDateTime(qrData.validUntil)}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleFullscreen}>
                  <Maximize className="h-4 w-4 mr-1" />
                  전체화면
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateQR(true)}
                  disabled={generateQR.isPending}
                >
                  {generateQR.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  QR 재생성
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 출석 현황 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">결제 완료</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출석 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkedIn}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출석률</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 + 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>신청자 목록</CardTitle>
            <div className="flex gap-1">
              {(["all", "checked", "unchecked"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === "all"
                    ? "전체"
                    : f === "checked"
                      ? "출석"
                      : "미출석"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {registrations.length === 0
                ? "결제 완료된 신청자가 없습니다."
                : "해당 조건의 신청자가 없습니다."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>회원등급</TableHead>
                  <TableHead>출석여부</TableHead>
                  <TableHead>출석시간</TableHead>
                  <TableHead>방법</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      {reg.user.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {reg.user.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MEMBER_TIER_LABELS[reg.user.tier] || reg.user.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reg.attendance ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          출석
                        </Badge>
                      ) : (
                        <Badge variant="secondary">미출석</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {reg.attendance
                        ? formatDateTime(reg.attendance.checkedInAt)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.attendance
                        ? reg.attendance.method === "QR"
                          ? "QR"
                          : "수동"
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!reg.attendance && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setManualDialog({
                              open: true,
                              userId: reg.userId,
                              userName: reg.user.name,
                            })
                          }
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          수동 체크인
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 수동 체크인 다이얼로그 */}
      <Dialog
        open={manualDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setManualDialog({ open: false, userId: "", userName: "" });
            setManualMemo("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수동 체크인</DialogTitle>
            <DialogDescription>
              {manualDialog.userName}님을 수동으로 출석 체크합니다.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">사유 (선택)</label>
            <Input
              placeholder="예: 현장 직접 확인"
              value={manualMemo}
              onChange={(e) => setManualMemo(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManualDialog({ open: false, userId: "", userName: "" });
                setManualMemo("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleManualCheckin}
              disabled={manualCheckin.isPending}
            >
              {manualCheckin.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <UserCheck className="h-4 w-4 mr-1" />
              )}
              체크인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
