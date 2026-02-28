export type SpeakerStatus =
  | "CANDIDATE"
  | "CONFIRMED"
  | "INFO_REQUESTED"
  | "INFO_SUBMITTED"
  | "INFO_REVIEWING"
  | "APPROVED"
  | "ARCHIVED";

export interface Speaker {
  id: string;
  status: SpeakerStatus;
  name: string;
  email?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
  title?: string | null;
  organization?: string | null;
  education?: string | null;
  career?: string | null;
  expertise: string[];
  linkedinUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  portalToken?: string | null;
  portalTokenExp?: string | null;
  company?: SpeakerCompany | null;
  contracts?: SpeakerContract[];
  seminars?: SeminarSummary[];
  lectureContents?: LectureContentSummary[];
  assignedTo?: string | null;
  notes?: string | null;
  _count?: {
    seminars?: number;
    contracts?: number;
    lectureContents?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerCompany {
  id: string;
  speakerId: string;
  companyName: string;
  establishedAt?: string | null;
  representative?: string | null;
  address?: string | null;
  businessType?: string | null;
  products?: string | null;
  financials?: string | null;
  patents?: string | null;
  copyrights?: string | null;
  certifications?: string | null;
  awards?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerContract {
  id: string;
  speakerId: string;
  seminarId?: string | null;
  fee: number;
  paymentTerms?: string | null;
  transportSupport: boolean;
  lodgingSupport: boolean;
  settlementStatus: string;
  settledAt?: string | null;
  contractFileUrl?: string | null;
  bankInfo?: string | null;
  taxInvoice: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LectureContentSummary {
  id: string;
  speakerId: string;
  seminarId: string;
  lectureTitle: string;
  businessMotivation?: string | null;
  marketEnvironment?: string | null;
  successFactors?: string | null;
  businessModel?: string | null;
  foundingStory?: string | null;
  keyMessages?: string | null;
  category?: string | null;
  presentationUrl?: string | null;
  attachments?: string | null;
  status: string;
  reviewComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SeminarSummary {
  id: string;
  title: string;
  startAt: string;
  status: string;
  type: string;
}

export interface SpeakerFormData {
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  organization?: string;
  education?: string;
  career?: string;
  expertise: string[];
  linkedinUrl?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  profileImageUrl?: string;
  notes?: string;
}

export interface SpeakerPortalData {
  speaker: Speaker;
  company: SpeakerCompany | null;
  lectureContents: LectureContentSummary[];
  assignedSeminars: SeminarSummary[];
}
