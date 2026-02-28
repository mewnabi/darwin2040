"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { SatisfactionData } from "@/types";

interface SatisfactionChartProps {
  data: SatisfactionData;
}

export function SatisfactionChart({ data }: SatisfactionChartProps) {
  if (data.responseCount === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        설문 응답 데이터가 없습니다.
      </p>
    );
  }

  const chartData = data.distribution.map((count, i) => ({
    name: `${i + 1}점`,
    응답수: count,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="응답수" fill="#C49A2A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
