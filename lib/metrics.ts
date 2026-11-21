import { faMonth } from "./format";
import type { Expense, ExpenseCategory, Floor, MaterialItem, ProjectState, Stage } from "./types";

export function daySpan(start: string, end: string) {
  const ms = Date.parse(end.slice(0, 10)) - Date.parse(start.slice(0, 10));
  return Math.max(1, Math.round(ms / 86_400_000));
}

export function stageWeight(stage: Stage) {
  return daySpan(stage.startDate, stage.endDate);
}

export function projectProgress(stages: Stage[]) {
  const total = stages.reduce((sum, stage) => sum + stageWeight(stage), 0);
  if (!total) return 0;
  const done = stages.reduce((sum, stage) => sum + stageWeight(stage) * (stage.progress / 100), 0);
  return (done / total) * 100;
}

export function floorArea(floors: Floor[]) {
  return floors.reduce((sum, floor) => sum + floor.area, 0);
}

export function floorUnits(floors: Floor[]) {
  return floors.reduce((sum, floor) => sum + floor.units, 0);
}

export function spentOf(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

export function stockOf(item: MaterialItem) {
  return item.purchased - item.consumed;
}

export function isLowStock(item: MaterialItem) {
  const remainingNeed = item.required - item.consumed;
  if (remainingNeed <= 0) return false;
  return stockOf(item) < remainingNeed * 0.25;
}

export function materialCost(item: MaterialItem) {
  return item.purchased * item.unitPrice;
}

export interface Snapshot {
  progress: number;
  budget: number;
  spent: number;
  remaining: number;
  forecast: number;
  variance: number;
  completedStages: number;
  activeStages: number;
  delayedStages: number;
  floorCount: number;
  unitCount: number;
  area: number;
  lowStock: MaterialItem[];
}

export function snapshot(state: ProjectState): Snapshot {
  const progress = projectProgress(state.stages);
  const spent = spentOf(state.expenses);
  const budget = state.project.budget;
  const forecast = progress > 0.5 ? spent / (progress / 100) : budget;
  return {
    progress,
    budget,
    spent,
    remaining: budget - spent,
    forecast,
    variance: forecast - budget,
    completedStages: state.stages.filter((stage) => stage.status === "completed").length,
    activeStages: state.stages.filter((stage) => stage.status === "in_progress").length,
    delayedStages: state.stages.filter((stage) => stage.status === "delayed").length,
    floorCount: state.floors.length,
    unitCount: floorUnits(state.floors),
    area: floorArea(state.floors),
    lowStock: state.materials.filter(isLowStock),
  };
}

export interface ProgressPoint {
  label: string;
  progress: number;
}

function monthStarts(from: string, to: string) {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const points: string[] = [];
  while (cursor <= end) {
    points.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const endIso = end.toISOString().slice(0, 10);
  if (points[points.length - 1] !== endIso) points.push(endIso);
  return points;
}

function stageProgressAt(stage: Stage, day: string, today: string) {
  if (stage.progress <= 0 || day < stage.startDate) return 0;
  if (stage.status === "completed") {
    const span = daySpan(stage.startDate, stage.endDate);
    const gone = Math.min(span, Math.max(0, daySpan(stage.startDate, day) - 1));
    return stage.progress * Math.min(1, gone / span);
  }
  const cap = today < stage.endDate ? today : stage.endDate;
  if (day >= cap) return stage.progress;
  const span = daySpan(stage.startDate, cap);
  const gone = Math.max(0, daySpan(stage.startDate, day) - 1);
  return stage.progress * Math.min(1, gone / span);
}

export function progressSeries(stages: Stage[], from: string, to: string): ProgressPoint[] {
  const total = stages.reduce((sum, stage) => sum + stageWeight(stage), 0) || 1;
  return monthStarts(from, to).map((day) => {
    const done = stages.reduce(
      (sum, stage) => sum + stageWeight(stage) * (stageProgressAt(stage, day, to) / 100),
      0,
    );
    return { label: faMonth(day), progress: Math.round((done / total) * 1000) / 10 };
  });
}

export function expensesByCategory(expenses: Expense[]) {
  const totals = new Map<ExpenseCategory, number>();
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }
  return [...totals.entries()].map(([category, value]) => ({ category, value }));
}

export function expensesByMonth(expenses: Expense[]) {
  const totals = new Map<string, { label: string; value: number; sort: string }>();
  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    const current = totals.get(key) ?? { label: faMonth(expense.date), value: 0, sort: key };
    current.value += expense.amount;
    totals.set(key, current);
  }
  return [...totals.values()].sort((a, b) => a.sort.localeCompare(b.sort));
}

export function plannedProgress(stage: Stage, today: string) {
  if (today <= stage.startDate) return 0;
  if (today >= stage.endDate) return 100;
  return (daySpan(stage.startDate, today) / daySpan(stage.startDate, stage.endDate)) * 100;
}
