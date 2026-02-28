"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberProfile } from "@/components/members/member-profile";
import { useMember, useUpdateMember } from "@/hooks/use-members";
import { useToast } from "@/hooks/use-toast";
import type { MemberUpdateData } from "@/types";

export default function AdminMemberDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const { toast } = useToast();

  const { data: member, isLoading, error } = useMember(id);
  const updateMember = useUpdateMember(id);

  const handleUpdate = async (data: MemberUpdateData) => {
    try {
      await updateMember.mutateAsync(data);
      toast({ title: "회원 정보가 수정되었습니다" });
    } catch (err) {
      toast({
        title: "수정 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/members">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              회원 목록
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/members">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              회원 목록
            </Button>
          </Link>
        </div>
        <p className="text-center text-muted-foreground py-12">
          회원 정보를 불러올 수 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/members">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            회원 목록
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{member.name}</h1>
      </div>

      <MemberProfile
        member={member}
        currentUserRole={session?.user?.role || "MEMBER"}
        onUpdate={handleUpdate}
        isUpdating={updateMember.isPending}
      />
    </div>
  );
}
