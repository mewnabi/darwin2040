"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Eye, ToggleLeft, ToggleRight, Trash2, Loader2 } from "lucide-react";
import { useSurveys, useToggleSurvey, useDeleteSurvey } from "@/hooks/use-surveys";
import { useToast } from "@/hooks/use-toast";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import type { Survey } from "@/types";

export default function AdminSurveysPage() {
  const { data: surveys, isLoading } = useSurveys();
  const { toast } = useToast();
  const deleteMutation = useDeleteSurvey();

  const handleDelete = (id: string) => {
    if (!confirm("이 설문을 삭제하시겠습니까?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: "설문이 삭제되었습니다" }),
      onError: (err) => toast({ title: err.message, variant: "destructive" }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">설문 관리</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
        </div>
      ) : !surveys || surveys.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            등록된 설문이 없습니다. 세미나가 완료되면 자동으로 설문이 생성됩니다.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">세미나</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">유형</th>
                <th className="text-center px-4 py-3 font-medium">응답 수</th>
                <th className="text-center px-4 py-3 font-medium">상태</th>
                <th className="text-center px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((survey) => (
                <SurveyRow
                  key={survey.id}
                  survey={survey}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SurveyRow({
  survey,
  onDelete,
}: {
  survey: Survey;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const toggleMutation = useToggleSurvey(survey.id);
  const [isActive, setIsActive] = useState(survey.isActive);

  const handleToggle = () => {
    const newActive = !isActive;
    setIsActive(newActive);
    toggleMutation.mutate(newActive, {
      onSuccess: () => {
        toast({
          title: newActive ? "설문이 활성화되었습니다" : "설문이 비활성화되었습니다",
        });
      },
      onError: (err) => {
        setIsActive(!newActive);
        toast({ title: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium truncate max-w-[300px]">
          {survey.seminar?.title || "삭제된 세미나"}
        </p>
        <p className="text-xs text-muted-foreground">
          {survey.seminar?.startAt
            ? new Date(survey.seminar.startAt).toLocaleDateString("ko-KR")
            : "-"}
        </p>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="inline-flex items-center rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-600">
          {survey.seminar?.type
            ? SEMINAR_TYPE_LABELS[survey.seminar.type]
            : "-"}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-medium">
        {survey._count?.responses ?? 0}명
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleToggle}
          className="inline-flex items-center gap-1"
          title={isActive ? "활성" : "비활성"}
        >
          {isActive ? (
            <ToggleRight className="h-6 w-6 text-green-500" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-gray-400" />
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/admin/surveys/${survey.id}`}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title="결과 보기"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {(survey._count?.responses ?? 0) === 0 && (
            <button
              onClick={() => onDelete(survey.id)}
              className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
              title="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
