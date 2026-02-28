"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberTable } from "@/components/members/member-table";
import {
  MEMBER_TIER_LABELS,
  USER_ROLE_LABELS,
} from "@/constants/member-tiers";
import { useMembers } from "@/hooks/use-members";

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const { data: members, isLoading } = useMembers({
    search: searchQuery || undefined,
    tier: tierFilter && tierFilter !== "all" ? tierFilter : undefined,
    role: roleFilter && roleFilter !== "all" ? roleFilter : undefined,
  });

  const hasFilters = searchQuery || tierFilter || roleFilter;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-navy-500" />
        <h1 className="text-2xl font-bold">회원 관리</h1>
        {members && (
          <span className="text-sm text-muted-foreground ml-auto">
            총 {members.length}명
          </span>
        )}
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름, 이메일, 전화번호, 사업체명 검색..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="등급" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 등급</SelectItem>
            {Object.entries(MEMBER_TIER_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="역할" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setTierFilter("");
              setRoleFilter("");
            }}
          >
            필터 초기화
          </Button>
        )}
      </div>

      {/* 회원 테이블 */}
      <MemberTable members={members ?? []} isLoading={isLoading} />
    </div>
  );
}
