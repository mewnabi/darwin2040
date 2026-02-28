import { SeminarCard } from "./seminar-card";
import { CardSkeleton } from "@/components/common/loading-skeleton";
import type { Seminar } from "@/types";

interface SeminarListProps {
  seminars?: Seminar[];
  isLoading?: boolean;
}

export function SeminarList({ seminars, isLoading }: SeminarListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!seminars || seminars.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">등록된 세미나가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {seminars.map((seminar) => (
        <SeminarCard key={seminar.id} seminar={seminar} />
      ))}
    </div>
  );
}
