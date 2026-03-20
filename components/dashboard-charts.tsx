"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const completionChartConfig = {
  completed: { label: "Completed", color: "#15803d" },
  failed: { label: "Failed", color: "#dc2626" },
} satisfies ChartConfig;

const energyChartConfig = {
  saas: { label: "SaaS", color: "#0ea5e9" },
  dsa: { label: "DSA", color: "#8b5cf6" },
  classwork: { label: "Classwork", color: "#10b981" },
} satisfies ChartConfig;

const averageHoursConfig = {
  actual: { label: "Actual Avg Hours", color: "#2563eb" },
  target: { label: "Target Avg Hours", color: "#94a3b8" },
} satisfies ChartConfig;

type DashboardChartsProps = {
  avgCategoryHours: Array<{
    category: string;
    actual: number;
    target: number;
  }>;
  dailyTaskOutcome: Array<{
    day: string;
    completed: number;
    failed: number;
  }>;
  energySplit: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
};

export function DashboardCharts({
  avgCategoryHours,
  dailyTaskOutcome,
  energySplit,
}: DashboardChartsProps) {
  return (
    <>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
          <p className="text-sm font-semibold text-foreground">Average Hours by Category</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Actual average daily hours compared with intended category targets.
          </p>
          <ChartContainer config={averageHoursConfig} className="mt-6 h-[260px] w-full">
            <BarChart data={avgCategoryHours}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="actual"
                fill="var(--color-actual)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="target"
                fill="var(--color-target)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
          <p className="text-sm font-semibold text-foreground">Energy Split</p>
          <p className="mt-1 text-sm text-muted-foreground">
            How your task time is divided across planner categories.
          </p>
          <ChartContainer config={energyChartConfig} className="mt-6 h-[260px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={energySplit}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={86}
                strokeWidth={4}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
        <p className="text-sm font-semibold text-foreground">Daily Task Outcomes</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed and failed task counts across the last 7 days.
        </p>
        <ChartContainer config={completionChartConfig} className="mt-6 h-[300px] w-full">
          <BarChart data={dailyTaskOutcome}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="completed"
              fill="var(--color-completed)"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="failed"
              fill="var(--color-failed)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </>
  );
}
