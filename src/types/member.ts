import type { UserRole, MemberTier } from "@prisma/client";

export type { UserRole, MemberTier };

export interface Member {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  profileImage?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  businessStage?: string | null;
  tier: MemberTier;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  name: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  businessStage?: string;
}

export interface MemberWithCounts extends Member {
  region?: string | null;
  _count: {
    registrations: number;
    attendances: number;
  };
}

export interface MemberRegistration {
  id: string;
  status: string;
  finalPrice: number;
  registeredAt: string;
  seminar: {
    id: string;
    title: string;
    startAt: string;
    type: string;
  };
}

export interface MemberAttendance {
  id: string;
  method: string;
  checkedInAt: string;
  seminar: {
    id: string;
    title: string;
    startAt: string;
    type: string;
  };
}

export interface MemberDetail extends Member {
  region?: string | null;
  birthYear?: number | null;
  gender?: string | null;
  isYouthFounder?: boolean;
  registrations: MemberRegistration[];
  attendances: MemberAttendance[];
  _count: {
    registrations: number;
    attendances: number;
    surveyResponses: number;
  };
}

export interface MemberUpdateData {
  role?: UserRole;
  tier?: MemberTier;
  name?: string;
  phone?: string | null;
  businessName?: string | null;
  businessType?: string | null;
  businessStage?: string | null;
  region?: string | null;
}

export interface MemberFilters {
  search?: string;
  tier?: string;
  role?: string;
}
