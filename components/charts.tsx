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
  border: "1px solid rgba(37,37,37,0.12)",
  borderRadius: 0,
  fontSize: 12,
  fontFamily: "inherit",
};

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  if (!points.length) return null;
  return (
    <div className="h-full w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(37,37,37,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6E695F" }} axisLine={false} tickLine={false} interval={2} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => faNum(Number(value), 0)}
            tick={{ fontSize: 11, fill: "#6E695F" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            formatter={(value) => faPercent(Number(value))}
            contentStyle={tooltipStyle}
          />
          <Area type="monotone" dataKey="progress" name="پیشرفت" stroke="#C87532" strokeWidth={2} fill="#C87532" fillOpacity={0.16} />
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
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="#fff">
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
          <CartesianGrid stroke="rgba(37,37,37,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6E695F" }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(value) => faNum(Number(value) / 1_000_000_000, 0)}
            tick={{ fontSize: 11, fill: "#6E695F" }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip formatter={(value) => faToman(Number(value))} contentStyle={tooltipStyle} />
          <Bar dataKey="value" name="هزینه" fill="#252525" maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
