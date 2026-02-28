"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CreditCard,
  CheckCircle,
  Loader2,
  Trash2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/status-badge";
import { SeminarForm } from "@/components/seminars/seminar-form";
import {
  SEMINAR_STATUS_LABELS,
  SEMINAR_STATUS_FLOW,
} from "@/constants/seminar-types";
import { useSeminar, useUpdateSeminar, useDeleteSeminar } from "@/hooks/use-seminars";
import { useToast } from "@/hooks/use-toast";
import type { SeminarStatus } from "@/types";

export default function AdminSeminarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: seminar, isLoading } = useSeminar(params.id);
  const updateSeminar = useUpdateSeminar(params.id);
  const deleteSeminar = useDeleteSeminar();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const handleStatusChange = async (newStatus: SeminarStatus) => {
    setChangingStatus(true);
    try {
      await updateSeminar.mutateAsync({ status: newStatus });
      toast({
        title: `상태가 "${SEMINAR_STATUS_LABELS[newStatus]}"(으)로 변경되었습니다`,
      });
    } catch (err) {
      toast({
        title: "상태 변경 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSeminar.mutateAsync(params.id);
      toast({ title: "세미나가 삭제되었습니다" });
      router.push("/admin/seminars");
    } catch (err) {
      toast({
        title: "삭제 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
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

  const nextStatuses = SEMINAR_STATUS_FLOW[seminar.status] || [];
  const registrationCount = seminar._count?.registrations ?? 0;
  const attendanceCount = seminar._count?.attendances ?? 0;
  const paymentCount = seminar._count?.payments ?? 0;

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href="/admin/seminars"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          세미나 관리
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{seminar.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge
                status={seminar.status}
                label={
                  SEMINAR_STATUS_LABELS[seminar.status] || seminar.status
                }
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 상태 변경 버튼 */}
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === "CANCELLED" ? "destructive" : "default"}
                size="sm"
                disabled={changingStatus}
                onClick={() => handleStatusChange(status as SeminarStatus)}
              >
                {changingStatus && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                )}
                {SEMINAR_STATUS_LABELS[status]}(으)로 변경
              </Button>
            ))}
            {/* 삭제 버튼 */}
            {seminar.status === "DRAFT" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">신청 현황</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrationCount}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {seminar.maxCapacity}명
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {seminar.maxCapacity - registrationCount > 0
                ? `잔여 ${seminar.maxCapacity - registrationCount}석`
                : "정원 마감"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">결제 현황</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentCount}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              결제 완료 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출석 현황</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceCount}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {registrationCount}명
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {registrationCount > 0
                ? `출석률 ${Math.round((attendanceCount / registrationCount) * 100)}%`
                : "신청자 없음"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭: 편집 / 신청자 */}
      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">세미나 정보 편집</TabsTrigger>
          <TabsTrigger value="registrations">
            신청자 ({registrationCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <div className="max-w-3xl">
            <SeminarForm seminar={seminar} />
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              신청자 관리 기능은 추후 구현 예정입니다.
              <br />
              <Link
                href={`/admin/seminars/${params.id}/registrations`}
                className="text-navy-500 hover:underline mt-2 inline-block"
              >
                신청자 관리 페이지로 이동
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세미나 삭제</DialogTitle>
            <DialogDescription>
              &ldquo;{seminar.title}&rdquo; 세미나를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSeminar.isPending}
            >
              {deleteSeminar.isPending ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
