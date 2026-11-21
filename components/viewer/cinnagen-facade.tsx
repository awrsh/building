"use client";

import * as THREE from "three";
import type { FloorKind } from "@/lib/viewer-math";

/** پالت مصالح از عکس‌های واقعی پردیس سیناژن */
export const CG = {
  brick: "#B4532A",
  brickDark: "#8F3F1F",
  brickLight: "#C4683C",
  panel: "#C5C8CC",
  panelDark: "#9AA0A6",
  steel: "#2A2A2A",
  steelSoft: "#3C3C3C",
  mullion: "#D6D9DC",
  glass: "#3A4A52",
  glassLite: "#5A6E78",
  screen: "#B8BDC2",
  canopy: "#1F1F1F",
  green: "#3D6B45",
  greenDark: "#2A4A30",
} as const;

export function Mat({
  color,
  opacity = 1,
  wireframe = false,
  roughness = 0.84,
  metalness = 0.04,
}: {
  color: string;
  opacity?: number;
  wireframe?: boolean;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      transparent={opacity < 0.995}
      opacity={opacity}
      wireframe={wireframe}
    />
  );
}

function at(axis: "x" | "z", along: number, y: number, fixed: number): [number, number, number] {
  return axis === "z" ? [along, y, fixed] : [fixed, y, along];
}

function dims(axis: "x" | "z", along: number, y: number, thick: number): [number, number, number] {
  return axis === "z" ? [along, y, thick] : [thick, y, along];
}

/** جابه‌جایی حجمی مدولار: کانتیلور، عقب‌نشینی، بالکن */
export function massingFor(level: number, kind: FloorKind) {
  if (kind === "basement") return { pushZ: -0.4, pushX: 0, w: 1, d: 1.02 };
  if (kind === "ground") return { pushZ: -1.35, pushX: 0.2, w: 1.02, d: 0.92 };
  if (kind === "roof") return { pushZ: -0.8, pushX: -0.6, w: 0.72, d: 0.78 };
  // طبقات میانی — الگوی تتریسی شبیه عکس‌ها
  const cycle = ((level % 5) + 5) % 5;
  if (cycle === 0) return { pushZ: 1.4, pushX: -0.8, w: 0.94, d: 1.06 };
  if (cycle === 1) return { pushZ: 0.55, pushX: 1.1, w: 1.04, d: 0.96 };
  if (cycle === 2) return { pushZ: -0.35, pushX: -1.2, w: 0.9, d: 1.08 };
  if (cycle === 3) return { pushZ: 1.05, pushX: 0.4, w: 1.08, d: 0.9 };
  return { pushZ: 0.2, pushX: -0.35, w: 0.96, d: 1.02 };
}

type BayStyle = "brick" | "glass" | "perforated" | "panel" | "screen" | "bump";

function bayStyle(kind: FloorKind, index: number, axis: "x" | "z", front: boolean): BayStyle {
  if (kind === "basement") return index % 3 === 1 ? "glass" : "brick";
  if (kind === "ground") return "glass";
  if (kind === "roof") return index % 2 === 0 ? "panel" : "screen";
  if (!front) {
    if (index % 4 === 0) return "perforated";
    if (index % 4 === 2) return "glass";
    return "brick";
  }
  const pattern = index % 6;
  if (pattern === 0 || pattern === 3) return "brick";
  if (pattern === 1) return "glass";
  if (pattern === 2) return "bump";
  if (pattern === 4) return "perforated";
  return "panel";
}

function GlassPane({
  axis,
  along,
  y,
  fixed,
  w,
  h,
  opacity,
}: {
  axis: "x" | "z";
  along: number;
  y: number;
  fixed: number;
  w: number;
  h: number;
  opacity: number;
}) {
  return (
    <mesh position={at(axis, along, y, fixed)}>
      <boxGeometry args={dims(axis, w, h, 0.05)} />
      <meshStandardMaterial
        color={CG.glass}
        transparent
        opacity={0.55 * opacity}
        roughness={0.08}
        metalness={0.35}
      />
    </mesh>
  );
}

function MullionGrid({
  axis,
  center,
  fixed,
  bay,
  height,
  base,
  glassH,
  opacity,
  cols = 2,
  rows = 2,
}: {
  axis: "x" | "z";
  center: number;
  fixed: number;
  bay: number;
  height: number;
  base: number;
  glassH: number;
  opacity: number;
  cols?: number;
  rows?: number;
}) {
  const nodes: React.ReactNode[] = [];
  const frame = 0.08;
  const innerW = Math.max(0.2, bay - 0.28);
  const cellW = innerW / cols;
  const cellH = glassH / rows;
  for (let c = 0; c <= cols; c += 1) {
    const x = center - innerW / 2 + c * cellW;
    nodes.push(
      <mesh key={`mv-${c}`} position={at(axis, x, base + glassH / 2, fixed)}>
        <boxGeometry args={dims(axis, frame, glassH, 0.07)} />
        <Mat color={CG.mullion} opacity={opacity} metalness={0.55} roughness={0.32} />
      </mesh>,
    );
  }
  for (let r = 0; r <= rows; r += 1) {
    const y = base + r * cellH;
    nodes.push(
      <mesh key={`mh-${r}`} position={at(axis, center, y, fixed)}>
        <boxGeometry args={dims(axis, innerW, frame, 0.07)} />
        <Mat color={CG.mullion} opacity={opacity} metalness={0.55} roughness={0.32} />
      </mesh>,
    );
  }
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      nodes.push(
        <GlassPane
          key={`g-${c}-${r}`}
          axis={axis}
          along={center - innerW / 2 + cellW * (c + 0.5)}
          y={base + cellH * (r + 0.5)}
          fixed={fixed}
          w={cellW - 0.06}
          h={cellH - 0.06}
          opacity={opacity}
        />,
      );
    }
  }
  // قاب بیرونی
  nodes.push(
    <mesh key="outer" position={at(axis, center, height / 2, fixed)} castShadow>
      <boxGeometry args={dims(axis, bay * 0.96, height, 0.12)} />
      <Mat color={CG.steelSoft} opacity={opacity * 0.15} metalness={0.4} roughness={0.5} />
    </mesh>,
  );
  return <group>{nodes}</group>;
}

function PerforatedBrick({
  axis,
  center,
  fixed,
  bay,
  height,
  opacity,
  wireframe,
}: {
  axis: "x" | "z";
  center: number;
  fixed: number;
  bay: number;
  height: number;
  opacity: number;
  wireframe: boolean;
}) {
  const nodes: React.ReactNode[] = [];
  const cols = 5;
  const rows = Math.max(4, Math.round(height / 0.55));
  const cellW = (bay * 0.82) / cols;
  const cellH = (height * 0.86) / rows;
  const startY = height * 0.07;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if ((r + c) % 2 === 0) continue;
      const along = center - (bay * 0.82) / 2 + cellW * (c + 0.5);
      const y = startY + cellH * (r + 0.5);
      nodes.push(
        <mesh key={`${r}-${c}`} position={at(axis, along, y, fixed + (axis === "z" ? 0.08 : 0))} castShadow>
          <boxGeometry args={dims(axis, cellW * 0.78, cellH * 0.72, 0.14)} />
          <Mat color={(r + c) % 4 === 0 ? CG.brickDark : CG.brick} opacity={opacity} wireframe={wireframe} roughness={0.92} />
        </mesh>,
      );
    }
  }
  nodes.push(
    <mesh key="back" position={at(axis, center, height / 2, fixed - (axis === "z" ? 0.06 : 0))} castShadow>
      <boxGeometry args={dims(axis, bay * 0.9, height * 0.95, 0.1)} />
      <Mat color={CG.brickDark} opacity={opacity * 0.85} wireframe={wireframe} />
    </mesh>,
  );
  return <group>{nodes}</group>;
}

function MetalScreen({
  axis,
  center,
  fixed,
  bay,
  height,
  opacity,
  wireframe,
}: {
  axis: "x" | "z";
  center: number;
  fixed: number;
  bay: number;
  height: number;
  opacity: number;
  wireframe: boolean;
}) {
  const nodes: React.ReactNode[] = [];
  const n = 7;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      if ((i + j) % 3 === 0) continue;
      const along = center - bay * 0.38 + (bay * 0.76 * i) / (n - 1);
      const y = height * 0.12 + (height * 0.76 * j) / (n - 1);
      nodes.push(
        <mesh key={`${i}-${j}`} position={at(axis, along, y, fixed + (axis === "z" ? 0.1 : 0))}>
          <boxGeometry args={dims(axis, bay * 0.08, height * 0.08, 0.04)} />
          <Mat color={CG.screen} opacity={opacity * 0.9} wireframe={wireframe} metalness={0.45} roughness={0.4} />
        </mesh>,
      );
    }
  }
  nodes.push(
    <mesh key="glass" position={at(axis, center, height / 2, fixed - 0.05)}>
      <boxGeometry args={dims(axis, bay * 0.85, height * 0.88, 0.04)} />
      <meshStandardMaterial color={CG.glassLite} transparent opacity={0.35 * opacity} roughness={0.1} metalness={0.3} />
    </mesh>,
  );
  return <group>{nodes}</group>;
}

function Louvers({
  axis,
  length,
  fixed,
  y,
  opacity,
  count = 3,
}: {
  axis: "x" | "z";
  length: number;
  fixed: number;
  y: number;
  opacity: number;
  count?: number;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={at(axis, 0, y + i * 0.18, fixed + (axis === "z" ? 0.12 : 0))} castShadow>
          <boxGeometry args={dims(axis, length * 0.92, 0.06, 0.1)} />
          <Mat color={CG.mullion} opacity={opacity} metalness={0.6} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

/** یک وجه نما به سبک سیناژن */
export function FacadeFace({
  length,
  height,
  kind,
  axis,
  fixed,
  opacity,
  wireframe,
  door,
  level,
}: {
  length: number;
  height: number;
  kind: FloorKind;
  axis: "x" | "z";
  fixed: number;
  opacity: number;
  wireframe: boolean;
  door?: boolean;
  level: number;
}) {
  const front = axis === "z" && fixed > 0;
  const bays = kind === "ground" ? 8 : kind === "roof" ? 6 : kind === "basement" ? 7 : 10;
  const bay = length / bays;
  const thick = 0.28;
  const nodes: React.ReactNode[] = [];

  for (let index = 0; index < bays; index += 1) {
    const center = -length / 2 + bay * index + bay / 2;
    const style = bayStyle(kind, index + Math.abs(level), axis, front);
    const isDoor = Boolean(door && index === Math.floor(bays / 2));

    if (isDoor && !wireframe) {
      nodes.push(
        <mesh key={`door-${index}`} position={at(axis, center, 1.45, fixed)} castShadow>
          <boxGeometry args={dims(axis, Math.min(2.4, bay * 0.7), 2.9, 0.1)} />
          <Mat color={CG.steel} opacity={opacity} metalness={0.35} roughness={0.4} />
        </mesh>,
      );
      continue;
    }

    if (style === "glass" || kind === "ground") {
      const glassH = kind === "ground" ? height * 0.88 : height * 0.62;
      const base = kind === "ground" ? height * 0.06 : height * 0.22;
      nodes.push(
        <MullionGrid
          key={`glass-${index}`}
          axis={axis}
          center={center}
          fixed={fixed}
          bay={bay}
          height={height}
          base={base}
          glassH={glassH}
          opacity={opacity}
          cols={kind === "ground" ? 2 : 2}
          rows={kind === "ground" ? 3 : 2}
        />,
      );
      // ستون‌های تیره بین بِی‌ها
      nodes.push(
        <mesh key={`pier-${index}`} position={at(axis, -length / 2 + bay * index + 0.08, height / 2, fixed)} castShadow>
          <boxGeometry args={dims(axis, 0.16, height, thick)} />
          <Mat color={CG.steel} opacity={opacity} metalness={0.4} roughness={0.45} />
        </mesh>,
      );
    } else if (style === "perforated") {
      nodes.push(
        <PerforatedBrick
          key={`perf-${index}`}
          axis={axis}
          center={center}
          fixed={fixed}
          bay={bay}
          height={height}
          opacity={opacity}
          wireframe={wireframe}
        />,
      );
    } else if (style === "screen") {
      nodes.push(
        <MetalScreen
          key={`scr-${index}`}
          axis={axis}
          center={center}
          fixed={fixed}
          bay={bay}
          height={height}
          opacity={opacity}
          wireframe={wireframe}
        />,
      );
    } else if (style === "panel") {
      nodes.push(
        <mesh key={`panel-${index}`} position={at(axis, center, height / 2, fixed)} castShadow>
          <boxGeometry args={dims(axis, bay * 0.94, height, thick)} />
          <Mat color={CG.panel} opacity={opacity} wireframe={wireframe} metalness={0.22} roughness={0.48} />
        </mesh>,
      );
      if (!wireframe) {
        nodes.push(
          <Louvers key={`lou-${index}`} axis={axis} length={bay * 0.8} fixed={fixed} y={height * 0.72} opacity={opacity} count={4} />,
        );
      }
    } else if (style === "bump") {
      const out = fixed + (axis === "z" ? (fixed > 0 ? 0.55 : -0.55) : fixed > 0 ? 0.55 : -0.55);
      nodes.push(
        <mesh key={`bump-box-${index}`} position={at(axis, center, height / 2, out)} castShadow>
          <boxGeometry args={dims(axis, bay * 0.88, height * 0.9, 0.5)} />
          <Mat color={CG.brick} opacity={opacity} wireframe={wireframe} roughness={0.9} />
        </mesh>,
      );
      if (!wireframe) {
        nodes.push(
          <MullionGrid
            key={`bump-g-${index}`}
            axis={axis}
            center={center}
            fixed={out + (axis === "z" ? (fixed > 0 ? 0.28 : -0.28) : fixed > 0 ? 0.28 : -0.28)}
            bay={bay * 0.75}
            height={height}
            base={height * 0.28}
            glassH={height * 0.48}
            opacity={opacity}
            cols={2}
            rows={2}
          />,
        );
      }
    } else {
      // آجر توپر
      nodes.push(
        <mesh key={`brick-${index}`} position={at(axis, center, height / 2, fixed)} castShadow>
          <boxGeometry args={dims(axis, bay * 0.98, height, thick)} />
          <Mat
            color={index % 2 === 0 ? CG.brick : CG.brickLight}
            opacity={opacity}
            wireframe={wireframe}
            roughness={0.92}
          />
        </mesh>,
      );
      if (!wireframe && index % 3 === 1) {
        const wh = height * 0.28;
        nodes.push(
          <GlassPane
            key={`slit-${index}`}
            axis={axis}
            along={center}
            y={height * 0.55}
            fixed={fixed + (axis === "z" ? 0.12 : 0)}
            w={bay * 0.45}
            h={wh}
            opacity={opacity}
          />,
        );
      }
    }
  }

  // نوار افقی فلزی بالای طبقه (امضای نمای سیناژن)
  if (kind !== "basement" && !wireframe) {
    nodes.push(
      <Louvers key="band" axis={axis} length={length} fixed={fixed} y={height - 0.35} opacity={opacity} count={3} />,
    );
  }

  // سایبان تیره همکف
  if (kind === "ground" && front && !wireframe) {
    nodes.push(
      <mesh key="canopy" position={at(axis, 0, height + 0.15, fixed + 1.4)} castShadow>
        <boxGeometry args={dims(axis, length * 0.7, 0.18, 2.6)} />
        <Mat color={CG.canopy} opacity={opacity} metalness={0.5} roughness={0.35} />
      </mesh>,
    );
  }

  return <group>{nodes}</group>;
}

/** گیاهان تراس روی لبه‌های عقب‌نشینی */
export function TerraceGreen({
  width,
  depth,
  y,
  opacity,
  amount,
}: {
  width: number;
  depth: number;
  y: number;
  opacity: number;
  amount: number;
}) {
  if (amount < 0.35) return null;
  const spots: [number, number][] = [
    [-width * 0.28, depth * 0.42],
    [width * 0.22, depth * 0.38],
    [width * 0.35, -depth * 0.2],
    [-width * 0.32, -depth * 0.35],
  ];
  return (
    <group position={[0, y, 0]}>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.35, 0.45, 0.7, 8]} />
            <Mat color={i % 2 ? CG.green : CG.greenDark} opacity={opacity} roughness={1} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <coneGeometry args={[0.55, 1.1, 7]} />
            <Mat color={CG.green} opacity={opacity} roughness={1} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.05, depth * 0.46]} receiveShadow>
        <boxGeometry args={[width * 0.5, 0.08, 1.2]} />
        <Mat color="#6B6358" opacity={opacity} />
      </mesh>
    </group>
  );
}

export function GroundCanopyColumns({
  width,
  depth,
  height,
  opacity,
  amount,
}: {
  width: number;
  depth: number;
  height: number;
  opacity: number;
  amount: number;
}) {
  if (amount < 0.2) return null;
  const xs = [-width * 0.32, -width * 0.1, width * 0.12, width * 0.34];
  return (
    <group>
      {xs.map((x) => (
        <mesh key={x} position={[x, height / 2, depth / 2 + 0.6]} castShadow>
          <boxGeometry args={[0.35, height * 0.95, 0.35]} />
          <Mat color={CG.steel} opacity={opacity} metalness={0.45} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// suppress unused THREE warning in some toolchains
void THREE;
