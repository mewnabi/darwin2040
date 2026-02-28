"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/common/status-badge";
import {
  MEMBER_TIER_LABELS,
  USER_ROLE_LABELS,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
} from "@/constants/member-tiers";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import type { MemberDetail, MemberUpdateData, UserRole, MemberTier } from "@/types";

interface MemberProfileProps {
  member: MemberDetail;
  currentUserRole: string;
  onUpdate: (data: MemberUpdateData) => Promise<void>;
  isUpdating?: boolean;
}

const TIER_OPTIONS: MemberTier[] = ["REGULAR", "ASSOCIATE", "VIP", "GUEST"];
const ROLE_OPTIONS: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD", "MEMBER", "ASSOCIATE", "GUEST"];

export function MemberProfile({ member, currentUserRole, onUpdate, isUpdating }: MemberProfileProps) {
  const [selectedTier, setSelectedTier] = useState<MemberTier>(member.tier);
  const [selectedRole, setSelectedRole] = useState<UserRole>(member.role);

  const hasChanges = selectedTier !== member.tier || selectedRole !== member.role;

  const handleSave = async () => {
    const data: MemberUpdateData = {};
    if (selectedTier !== member.tier) data.tier = selectedTier;
    if (selectedRole !== member.role) data.role = selectedRole;
    await onUpdate(data);
  };

  const availableRoles = currentUserRole === "SUPER_ADMIN"
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r !== "SUPER_ADMIN");

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">이름</dt>
              <dd className="font-medium">{member.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">이메일</dt>
              <dd className="font-medium">{member.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">전화번호</dt>
              <dd className="font-medium">{member.phone || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">지역</dt>
              <dd className="font-medium">{member.region || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">가입일</dt>
              <dd className="font-medium">{formatDate(member.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">최근 수정일</dt>
              <dd className="font-medium">{formatDate(member.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 등급/역할 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">등급 / 역할</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">회원 등급</label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as MemberTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {MEMBER_TIER_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">역할</label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {USER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasChanges && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? "저장 중..." : "변경사항 저장"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사업 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">사업 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">사업체명</dt>
              <dd className="font-medium">{member.businessName || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">업종</dt>
              <dd className="font-medium">{member.businessType || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">사업 단계</dt>
              <dd className="font-medium">{member.businessStage || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">청년 창업자</dt>
              <dd className="font-medium">{member.isYouthFounder ? "예" : "아니오"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 활동 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">활동 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{member._count.registrations}</p>
              <p className="text-sm text-muted-foreground">세미나 신청</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{member._count.attendances}</p>
              <p className="text-sm text-muted-foreground">출석</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{member._count.surveyResponses}</p>
              <p className="text-sm text-muted-foreground">설문 응답</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 신청 이력 */}
      {member.registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">신청 이력 (최근 20건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>세미나</TableHead>
                    <TableHead className="w-[80px]">유형</TableHead>
                    <TableHead className="w-[130px]">일시</TableHead>
                    <TableHead className="w-[80px]">상태</TableHead>
                    <TableHead className="w-[100px] text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Link
                          href={`/admin/seminars/${reg.seminar.id}`}
                          className="text-sm hover:text-navy-500 transition-colors"
                        >
                          {reg.seminar.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {SEMINAR_TYPE_LABELS[reg.seminar.type] || reg.seminar.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDateTime(reg.seminar.startAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={reg.status}
                          label={REGISTRATION_STATUS_LABELS[reg.status] || reg.status}
                          colorMap={REGISTRATION_STATUS_COLORS}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm">
                          {reg.finalPrice === 0 ? "무료" : formatCurrency(reg.finalPrice)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 출석 이력 */}
      {member.attendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">출석 이력 (최근 20건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>세미나</TableHead>
                    <TableHead className="w-[80px]">유형</TableHead>
                    <TableHead className="w-[80px]">출석 방법</TableHead>
                    <TableHead className="w-[150px]">체크인 시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.attendances.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell>
                        <Link
                          href={`/admin/seminars/${att.seminar.id}`}
                          className="text-sm hover:text-navy-500 transition-colors"
                        >
                          {att.seminar.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {SEMINAR_TYPE_LABELS[att.seminar.type] || att.seminar.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {att.method === "QR" ? "QR" : "수동"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDateTime(att.checkedInAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
