import type { Floor, Stage } from "./types";

/** ردپای ساختمان نزدیک به حجم‌های مدولار پردیس سیناژن */
export const FOOTPRINT = { width: 48, depth: 24 };

export interface LayerFlags {
  structure: boolean;
  walls: boolean;
  facade: boolean;
  mep: boolean;
}

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  if (edge0 === edge1) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function stagger(t: number, start: number, end: number, index: number, count: number) {
  const span = Math.max(0.0001, end - start);
  const overlap = span * 0.78;
  const step = count <= 1 ? 0 : (span - overlap) / (count - 1);
  const a = start + index * step;
  return smoothstep(a, a + overlap, t);
}

export interface FloorPlacement {
  floor: Floor;
  base: number;
  height: number;
  index: number;
}

export function floorLayout(floors: Floor[]) {
  const sorted = [...floors].sort((a, b) => a.level - b.level);
  const ground = sorted.findIndex((floor) => floor.level >= 0);
  const origin = ground === -1 ? 0 : ground;
  const map = new Map<string, FloorPlacement>();
  let cursor = 0;
  for (let index = origin; index < sorted.length; index += 1) {
    map.set(sorted[index].id, {
      floor: sorted[index],
      base: cursor,
      height: sorted[index].height,
      index,
    });
    cursor += sorted[index].height;
  }
  const top = cursor;
  cursor = 0;
  for (let index = origin - 1; index >= 0; index -= 1) {
    cursor -= sorted[index].height;
    map.set(sorted[index].id, {
      floor: sorted[index],
      base: cursor,
      height: sorted[index].height,
      index,
    });
  }
  const lowest = sorted.length ? (map.get(sorted[0].id)?.base ?? 0) : 0;
  const grade =
    origin < sorted.length && sorted[origin].level >= 0
      ? (map.get(sorted[origin].id)?.base ?? 0)
      : 0;
  const topLevel = sorted.reduce((max, floor) => Math.max(max, floor.level), 0);
  return { sorted, map, top, lowest, grade, topLevel };
}

export type FloorKind = "basement" | "ground" | "typical" | "roof";

export function floorKind(floor: Floor, topLevel: number): FloorKind {
  if (floor.level < 0) return "basement";
  if (floor.level === 0) return "ground";
  if (floor.level === topLevel) return "roof";
  return "typical";
}

export interface VisualAmounts {
  excavation: number;
  foundation: number;
  structure: number;
  slab: number;
  walls: number;
  mep: number;
  finish: number;
  facade: number;
  equipment: number;
}

function stageWindow(stages: Stage[], id: string) {
  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const count = Math.max(1, sorted.length);
  const index = sorted.findIndex((stage) => stage.id === id);
  if (index < 0) return null;
  return { a: index / count, b: (index + 1) / count };
}

export function visualAmounts(args: {
  simulation: number | null;
  index: number;
  count: number;
  floor: Floor;
  stages: Stage[];
  showComplete: boolean;
  layers: LayerFlags;
}): VisualAmounts {
  const above = args.floor.level >= 0;
  let amounts: VisualAmounts;

  if (args.simulation != null) {
    const t = args.simulation;
    const band = (id: string, a: number, b: number) => stageWindow(args.stages, id) ?? { a, b };
    const foundation = band("foundation", 0.1, 0.2);
    const structure = band("structure", 0.2, 0.3);
    const slabs = band("slabs", 0.3, 0.4);
    const walls = band("walls", 0.4, 0.5);
    const mep = band("mep", 0.5, 0.6);
    const finish = band("finish", 0.6, 0.7);
    const facade = band("facade", 0.7, 0.8);
    const equipment = band("equipment", 0.8, 0.9);
    amounts = {
      excavation: 1 - smoothstep(foundation.a, foundation.b, t),
      foundation: smoothstep(foundation.a, foundation.b, t),
      structure: stagger(t, structure.a, structure.b, args.index, args.count),
      slab: stagger(t, slabs.a, slabs.b, args.index, args.count),
      walls: stagger(t, walls.a, walls.b, args.index, args.count),
      mep: stagger(t, mep.a, mep.b, args.index, args.count),
      finish: stagger(t, finish.a, finish.b, args.index, args.count),
      facade: above ? stagger(t, facade.a, facade.b, args.index, args.count) : 0,
      equipment: smoothstep(equipment.a, equipment.b, t),
    };
  } else if (args.showComplete) {
    amounts = {
      excavation: 0,
      foundation: 1,
      structure: 1,
      slab: 1,
      walls: 1,
      mep: 1,
      finish: 1,
      facade: above ? 1 : 0,
      equipment: 1,
    };
  } else {
    const stageProgress = (id: string, fallback: number) => {
      const stage = args.stages.find((item) => item.id === id);
      return stage ? stage.progress / 100 : fallback;
    };
    const bias = 1 - args.index / Math.max(1, args.count - 1);
    amounts = {
      excavation: 0,
      foundation: stageProgress("foundation", 1),
      structure: args.floor.structure / 100,
      slab: args.floor.structure / 100,
      walls: args.floor.masonry / 100,
      mep: args.floor.mep / 100,
      finish: args.floor.finishing / 100,
      facade: above ? clamp01(stageProgress("facade", 0) * (0.25 + 0.9 * bias)) : 0,
      equipment: stageProgress("equipment", 0),
    };
  }

  if (!args.layers.structure) {
    amounts = { ...amounts, foundation: 0, structure: 0, slab: 0 };
  }
  if (!args.layers.walls) amounts = { ...amounts, walls: 0, finish: 0 };
  if (!args.layers.facade) amounts = { ...amounts, facade: 0 };
  if (!args.layers.mep) amounts = { ...amounts, mep: 0 };
  return amounts;
}

export function activeStageIndex(t: number, count: number) {
  if (count <= 0) return 0;
  if (t >= 1) return count - 1;
  return Math.min(count - 1, Math.floor(t * count + 0.0001));
}

function channels(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

export function mixHex(from: string, to: string, t: number) {
  const k = clamp01(t);
  const a = channels(from);
  const b = channels(to);
  const mix = (index: number) => Math.round(a[index] + (b[index] - a[index]) * k);
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;
}

export function wallColor(kind: FloorKind, finish: number, facade: number) {
  // آجر قرمز سیناژن → با پیشرفت نازک‌کاری کمی روشن‌تر می‌شود
  if (kind === "basement") return mixHex("#7A4A3A", "#9A6A58", finish);
  const brick = mixHex("#A34422", "#C4683C", finish * 0.45);
  const clad = mixHex(brick, "#B8BCC0", facade * 0.55);
  return clad;
}
