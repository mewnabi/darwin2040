export type SeminarType = "MAIN_GAME" | "SPINUP_GAME" | "SPECIAL";

export type SeminarStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface SeminarSpeaker {
  id: string;
  name: string;
  organization?: string | null;
  title?: string | null;
  profileImageUrl?: string | null;
  career?: string | null;
  education?: string | null;
  expertise?: string[];
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
}

export interface SeminarLectureContent {
  lectureTitle: string;
  businessMotivation?: string | null;
  marketEnvironment?: string | null;
  successFactors?: string | null;
  businessModel?: string | null;
  foundingStory?: string | null;
  keyMessages?: string | null;
  category?: string | null;
}

export interface Seminar {
  id: string;
  title: string;
  description?: string | null;
  type: SeminarType;
  status: SeminarStatus;
  startAt: string;
  endAt: string;
  venue?: string | null;
  venueAddress?: string | null;
  onlineLink?: string | null;
  maxCapacity: number;
  basePrice: number;
  regularDiscount: number;
  vipDiscount: number;
  earlyBirdDays: number;
  earlyBirdRate: number;
  speakerId?: string | null;
  speaker?: SeminarSpeaker | null;
  lectureContent?: SeminarLectureContent | null;
  category?: string | null;
  thumbnailUrl?: string | null;
  chapterId?: string | null;
  _count?: {
    registrations: number;
    attendances: number;
    payments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SeminarFormData {
  title: string;
  description?: string;
  type: SeminarType;
  startAt: string;
  endAt: string;
  venue?: string;
  venueAddress?: string;
  onlineLink?: string;
  maxCapacity: number;
  basePrice: number;
  regularDiscount: number;
  vipDiscount: number;
  earlyBirdDays: number;
  earlyBirdRate: number;
  speakerId?: string | null;
  category?: string;
  thumbnailUrl?: string;
  status?: SeminarStatus;
}
