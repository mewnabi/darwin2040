"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DemographicData } from "@/types";

interface DemographicsChartProps {
  data: DemographicData;
}

const COLORS = ["#1B2A4A", "#C49A2A", "#3B5998", "#E8A838", "#6B7280", "#9CA3AF"];

export function DemographicsChart({ data }: DemographicsChartProps) {
  const hasData =
    data.ageGroups.some((d) => d.count > 0) ||
    data.genderDistribution.some((d) => d.count > 0) ||
    data.regionDistribution.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        인구통계 데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ChartSection
        title="연령대 분포"
        data={data.ageGroups.filter((d) => d.count > 0)}
      />
      <ChartSection
        title="성별 분포"
        data={data.genderDistribution.filter((d) => d.count > 0)}
      />
      <ChartSection
        title="지역 분포"
        data={data.regionDistribution.filter((d) => d.count > 0).slice(0, 6)}
      />
    </div>
  );
}

function ChartSection({
  title,
  data,
}: {
  title: string;
  data: { label: string; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="text-center">
        <h4 className="text-sm font-medium mb-2">{title}</h4>
        <p className="text-xs text-muted-foreground py-4">데이터 없음</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.label, value: d.count }));

  return (
    <div>
      <h4 className="text-sm font-medium mb-2 text-center">{title}</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ name, percent }: { name?: string; percent?: number }) =>
              `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
            }
            labelLine={false}
            fontSize={11}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
