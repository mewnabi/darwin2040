"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "@prisma/client";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "CHAPTER_LEAD"];

export function useAuth() {
  const { data: session, status, update } = useSession();

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isAdmin: session?.user ? ADMIN_ROLES.includes(session.user.role) : false,
    isSuperAdmin: session?.user?.role === "SUPER_ADMIN",
    role: session?.user?.role ?? null,
    tier: session?.user?.tier ?? null,
    update,
  };
}
