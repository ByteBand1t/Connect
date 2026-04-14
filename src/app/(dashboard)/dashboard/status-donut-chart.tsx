"use client";

import { useMemo } from "react";

type ChartSlice = {
  name: string;
  value: number;
  color: string;
};

export function StatusDonutChart({ data, total }: { data: ChartSlice[]; total: number }) {
  const chartData = useMemo(() => data.filter((item) => item.value > 0), [data]);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;

  return (
    <div className="relative h-64">
      <svg viewBox="0 0 200 200" className="mx-auto h-full max-h-64 w-full max-w-64 -rotate-90">
        <circle cx="100" cy="100" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="24" />
        {totalValue > 0 &&
          chartData.map((entry) => {
            const segmentLength = (entry.value / totalValue) * circumference;
            const segmentOffset = offset;
            offset += segmentLength;
            return (
              <circle
                key={entry.name}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={entry.color}
                strokeWidth="24"
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-segmentOffset}
                strokeLinecap="butt"
              />
            );
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{total}</div>
        <div className="text-xs text-muted-foreground">Total assets</div>
      </div>
    </div>
  );
}
