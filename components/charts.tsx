"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { faNum, faPercent, faToman } from "@/lib/format";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/labels";
import type { ProgressPoint } from "@/lib/metrics";
import type { ExpenseCategory } from "@/lib/types";

const tooltipStyle = {
  background: "rgba(10, 16, 28, 0.95)",
  border: "1px solid rgba(34, 211, 238, 0.25)",
  borderRadius: 10,
  fontSize: 12,
  fontFamily: "inherit",
  color: "#e8eef8",
};

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  if (!points.length) return null;
  return (
    <div className="h-full w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => faNum(Number(value), 0)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip formatter={(value) => faPercent(Number(value))} contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="progress" name="پیشرفت" stroke="#22d3ee" strokeWidth={2} fill="url(#progressFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({
  items,
}: {
  items: { category: ExpenseCategory; value: number }[];
}) {
  const data = items.map((item) => ({
    name: CATEGORY_LABEL[item.category],
    value: item.value,
    color: CATEGORY_COLOR[item.category],
  }));
  if (!data.length) return null;
  return (
    <div className="h-52 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="#0a101c">
            {data.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => faToman(Number(value))} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyCostChart({ items }: { items: { label: string; value: number }[] }) {
  if (!items.length) return null;
  return (
    <div className="h-56 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(value) => faNum(Number(value) / 1_000_000_000, 0)}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip formatter={(value) => faToman(Number(value))} contentStyle={tooltipStyle} />
          <Bar dataKey="value" name="هزینه" fill="#22d3ee" maxBarSize={28} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
