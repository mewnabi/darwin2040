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
