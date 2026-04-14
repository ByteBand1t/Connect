"use client";

import { useEffect, useMemo, useState } from "react";

type ChartSlice = {
  name: string;
  value: number;
  color: string;
};

type RechartsModule = {
  PieChart: React.ComponentType<React.SVGProps<SVGSVGElement> & { width?: number; height?: number }>;
  Pie: React.ComponentType<Record<string, unknown>>;
  Cell: React.ComponentType<Record<string, unknown>>;
  ResponsiveContainer: React.ComponentType<{ width?: string | number; height?: string | number; children: React.ReactNode }>;
};

export function StatusDonutChart({ data, total }: { data: ChartSlice[]; total: number }) {
  const [recharts, setRecharts] = useState<RechartsModule | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadChartLib() {
      const moduleName = "recharts";
      try {
        const mod = (await import(moduleName)) as unknown as RechartsModule;
        if (mounted) {
          setRecharts(mod);
        }
      } catch {
        if (mounted) {
          setRecharts(null);
        }
      }
    }

    loadChartLib();

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => data.filter((item) => item.value > 0), [data]);

  if (!recharts) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Chart library unavailable in this environment.
      </div>
    );
  }

  const { PieChart, Pie, Cell, ResponsiveContainer } = recharts;

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            innerRadius={65}
            outerRadius={90}
            strokeWidth={2}
            paddingAngle={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{total}</div>
        <div className="text-xs text-muted-foreground">Total assets</div>
      </div>
    </div>
  );
}
