"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Send,
  Archive,
  Mic2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/common/status-badge";
import {
  SPEAKER_STATUS_LABELS,
  SPEAKER_STATUS_COLORS,
  EXPERTISE_TAGS,
} from "@/constants/speaker-status";
import { useSpeakers, useUpdateSpeaker, useRequestSpeakerInfo } from "@/hooks/use-speakers";
import { useToast } from "@/hooks/use-toast";

export default function AdminSpeakersPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [expertiseFilter, setExpertiseFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: speakers, isLoading } = useSpeakers({
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    expertise:
      expertiseFilter && expertiseFilter !== "all"
        ? expertiseFilter
        : undefined,
    search: searchQuery || undefined,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">연사 관리</h1>
        <Link href="/admin/speakers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            연사 등록
          </Button>
        </Link>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="연사 이름, 소속 검색..."
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
            {Object.entries(SPEAKER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="전문분야" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 분야</SelectItem>
            {EXPERTISE_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(statusFilter || expertiseFilter || searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("");
              setExpertiseFilter("");
              setSearchQuery("");
            }}
          >
            필터 초기화
          </Button>
        )}
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>연사</TableHead>
              <TableHead className="w-[180px]">전문분야</TableHead>
              <TableHead className="w-[90px]">상태</TableHead>
              <TableHead className="w-[80px] text-right">세미나</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-8 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : !speakers || speakers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-muted-foreground"
                >
                  등록된 연사가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              speakers.map((speaker) => (
                <SpeakerRow key={speaker.id} speaker={speaker} router={router} toast={toast} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SpeakerRow({
  speaker,
  router,
  toast,
}: {
  speaker: {
    id: string;
    name: string;
    organization?: string | null;
    title?: string | null;
    profileImageUrl?: string | null;
    expertise: string[];
    status: string;
    _count?: { seminars?: number };
  };
  router: ReturnType<typeof useRouter>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const updateSpeaker = useUpdateSpeaker(speaker.id);
  const requestInfo = useRequestSpeakerInfo(speaker.id);

  const handleRequestInfo = async () => {
    try {
      const result = await requestInfo.mutateAsync();
      toast({
        title: "정보 요청이 발송되었습니다",
        description: `포털 URL: ${result.portalUrl}`,
      });
    } catch (err) {
      toast({
        title: "정보 요청 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async () => {
    try {
      await updateSpeaker.mutateAsync({ status: "ARCHIVED" });
      toast({ title: "보관 처리되었습니다" });
    } catch (err) {
      toast({
        title: "보관 처리 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/admin/speakers/${speaker.id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {speaker.profileImageUrl ? (
            <img
              src={speaker.profileImageUrl}
              alt={speaker.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-navy-100 flex items-center justify-center">
              <Mic2 className="h-4 w-4 text-navy-500" />
            </div>
          )}
          <div>
            <span className="font-medium hover:text-navy-500 transition-colors">
              {speaker.name}
            </span>
            {(speaker.organization || speaker.title) && (
              <p className="text-xs text-muted-foreground">
                {[speaker.organization, speaker.title].filter(Boolean).join(" / ")}
              </p>
            )}
          </div>
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {speaker.expertise.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {speaker.expertise.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{speaker.expertise.length - 3}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge
          status={speaker.status}
          label={SPEAKER_STATUS_LABELS[speaker.status] || speaker.status}
          colorMap={SPEAKER_STATUS_COLORS}
        />
      </TableCell>
      <TableCell className="text-right">
        <span className="text-sm">{speaker._count?.seminars ?? 0}회</span>
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
              onClick={() => router.push(`/admin/speakers/${speaker.id}`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              편집
            </DropdownMenuItem>
            {(speaker.status === "CONFIRMED" || speaker.status === "INFO_REVIEWING") && (
              <DropdownMenuItem onClick={handleRequestInfo}>
                <Send className="h-4 w-4 mr-2" />
                정보 요청
              </DropdownMenuItem>
            )}
            {speaker.status !== "ARCHIVED" && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4 mr-2" />
                보관처리
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
