"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  CalendarDays,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common/status-badge";
import { SeminarCalendar } from "@/components/seminars/seminar-calendar";
import {
  SEMINAR_TYPE_LABELS,
  SEMINAR_STATUS_LABELS,
} from "@/constants/seminar-types";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { useSeminars, useDeleteSeminar } from "@/hooks/use-seminars";
import { useToast } from "@/hooks/use-toast";
import type { Seminar } from "@/types";

export default function AdminSeminarsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Seminar | null>(null);

  const { data: seminars, isLoading } = useSeminars({
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
    search: searchQuery || undefined,
  });

  const deleteSeminar = useDeleteSeminar();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSeminar.mutateAsync(deleteTarget.id);
      toast({ title: "세미나가 삭제되었습니다" });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: "삭제 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">세미나 관리</h1>
        <Link href="/admin/seminars/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            새 세미나
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="세미나 검색..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {Object.entries(SEMINAR_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {Object.entries(SEMINAR_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(statusFilter || typeFilter || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setSearchQuery("");
            }}
          >
            필터 초기화
          </Button>
        )}
      </div>

      {/* 탭: 테이블 / 캘린더 */}
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table" className="gap-1.5">
            <List className="h-4 w-4" />
            목록
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            캘린더
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[100px]">유형</TableHead>
                  <TableHead className="w-[130px]">일시</TableHead>
                  <TableHead className="w-[70px]">상태</TableHead>
                  <TableHead className="w-[80px] text-right">신청/정원</TableHead>
                  <TableHead className="w-[100px] text-right">가격</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <div className="h-8 bg-muted animate-pulse rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !seminars || seminars.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      등록된 세미나가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  seminars.map((seminar) => (
                    <TableRow key={seminar.id}>
                      <TableCell>
                        <Link
                          href={`/admin/seminars/${seminar.id}`}
                          className="font-medium hover:text-navy-500 transition-colors"
                        >
                          {seminar.title}
                        </Link>
                        {seminar.speaker && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            연사: {seminar.speaker.name}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm">
                          {SEMINAR_TYPE_LABELS[seminar.type] || seminar.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDateTime(seminar.startAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={seminar.status}
                          label={
                            SEMINAR_STATUS_LABELS[seminar.status] ||
                            seminar.status
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">
                          {seminar._count?.registrations ?? 0} /{" "}
                          {seminar.maxCapacity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">
                          {seminar.basePrice === 0
                            ? "무료"
                            : formatCurrency(seminar.basePrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/seminars/${seminar.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              편집
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `/seminars/${seminar.id}`,
                                  "_blank",
                                )
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              미리보기
                            </DropdownMenuItem>
                            {seminar.status === "DRAFT" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteTarget(seminar)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <SeminarCalendar seminars={seminars ?? []} />
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>세미나 삭제</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; 세미나를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
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
