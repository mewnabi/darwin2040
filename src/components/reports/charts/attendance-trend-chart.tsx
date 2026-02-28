"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AttendanceTrend } from "@/types";

interface AttendanceTrendChartProps {
  data: AttendanceTrend[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        데이터가 없습니다.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    name: d.date,
    신청: d.registered,
    출석: d.attended,
    출석률: d.rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="신청"
          stroke="#1B2A4A"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="출석"
          stroke="#C49A2A"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
