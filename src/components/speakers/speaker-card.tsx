import { Mic2 } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import {
  SPEAKER_STATUS_LABELS,
  SPEAKER_STATUS_COLORS,
} from "@/constants/speaker-status";
import type { Speaker } from "@/types";

interface SpeakerCardProps {
  speaker: Speaker;
}

export function SpeakerCard({ speaker }: SpeakerCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        {speaker.profileImageUrl ? (
          <img
            src={speaker.profileImageUrl}
            alt={speaker.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-navy-100 flex items-center justify-center">
            <Mic2 className="h-5 w-5 text-navy-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{speaker.name}</h4>
            <StatusBadge
              status={speaker.status}
              label={SPEAKER_STATUS_LABELS[speaker.status] || speaker.status}
              colorMap={SPEAKER_STATUS_COLORS}
            />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {[speaker.organization, speaker.title].filter(Boolean).join(" / ")}
          </p>
        </div>
        {speaker._count?.seminars !== undefined && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            세미나 {speaker._count.seminars}회
          </span>
        )}
      </div>
      {speaker.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {speaker.expertise.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
