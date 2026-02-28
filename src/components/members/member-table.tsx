"use client";

import Link from "next/link";
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
  MEMBER_TIER_COLORS,
  USER_ROLE_LABELS,
} from "@/constants/member-tiers";
import { formatDate } from "@/lib/utils";
import type { MemberWithCounts } from "@/types";

interface MemberTableProps {
  members: MemberWithCounts[];
  isLoading?: boolean;
}

export function MemberTable({ members, isLoading }: MemberTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름 / 이메일</TableHead>
            <TableHead className="w-[80px]">등급</TableHead>
            <TableHead className="w-[90px]">역할</TableHead>
            <TableHead className="hidden md:table-cell">사업체</TableHead>
            <TableHead className="hidden lg:table-cell w-[80px]">지역</TableHead>
            <TableHead className="w-[60px] text-right">신청</TableHead>
            <TableHead className="w-[60px] text-right">출석</TableHead>
            <TableHead className="hidden md:table-cell w-[110px]">가입일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <div className="h-8 bg-muted animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-12 text-muted-foreground"
              >
                회원이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Link
                    href={`/admin/members/${member.id}`}
                    className="font-medium hover:text-navy-500 transition-colors"
                  >
                    {member.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={member.tier}
                    label={MEMBER_TIER_LABELS[member.tier] || member.tier}
                    colorMap={MEMBER_TIER_COLORS}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {USER_ROLE_LABELS[member.role] || member.role}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {member.businessName || "-"}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {member.region || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm">{member._count.registrations}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm">{member._count.attendances}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(member.createdAt)}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
