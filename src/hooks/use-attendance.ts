"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface QRCodeData {
  qrCode: string;
  qrImageDataUrl: string;
  qrUrl: string;
  validFrom: string;
  validUntil: string;
}

interface AttendanceRecord {
  id: string;
  userId: string;
  seminarId: string;
  method: "QR" | "MANUAL";
  checkedInAt: string;
  memo?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
}

interface RegistrationWithAttendance {
  id: string;
  userId: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    tier: string;
  };
  attendance?: AttendanceRecord | null;
}

interface AttendanceListData {
  registrations: RegistrationWithAttendance[];
  stats: {
    total: number;
    checkedIn: number;
    rate: number;
  };
}

interface CheckinResult {
  attendance: AttendanceRecord;
  message: string;
}

export function useQRCode(seminarId: string) {
  return useQuery<QRCodeData>({
    queryKey: ["qr", seminarId],
    queryFn: async () => {
      const res = await fetch(`/api/seminars/${seminarId}/qr`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "QR 코드를 불러올 수 없습니다");
      }
      return res.json();
    },
    enabled: false, // 수동 호출
  });
}

export function useGenerateQR(seminarId: string) {
  const queryClient = useQueryClient();
  return useMutation<QRCodeData, Error, { regenerate?: boolean }>({
    mutationFn: async ({ regenerate } = {}) => {
      const url = `/api/seminars/${seminarId}/qr${regenerate ? "?regenerate=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "QR 코드 생성에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["qr", seminarId], data);
    },
  });
}

export function useCheckin(seminarId: string) {
  return useMutation<CheckinResult, Error, { code: string }>({
    mutationFn: async ({ code }) => {
      const res = await fetch(`/api/seminars/${seminarId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "체크인에 실패했습니다");
      }
      return res.json();
    },
  });
}

export function useManualCheckin(seminarId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    CheckinResult,
    Error,
    { userId: string; memo?: string }
  >({
    mutationFn: async ({ userId, memo }) => {
      const res = await fetch(`/api/seminars/${seminarId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, method: "MANUAL", memo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "수동 체크인에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", seminarId] });
    },
  });
}

export function useAttendanceList(seminarId: string) {
  return useQuery<AttendanceListData>({
    queryKey: ["attendance", seminarId],
    queryFn: async () => {
      const res = await fetch(`/api/seminars/${seminarId}/attendance`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "출석 목록을 불러올 수 없습니다");
      }
      return res.json();
    },
    refetchInterval: 10000, // 10초 자동 갱신
  });
}
