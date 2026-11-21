"use client";

import { Edges, Grid, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { Floor, Stage } from "@/lib/types";
import {
  FOOTPRINT,
  floorKind,
  floorLayout,
  visualAmounts,
  type FloorKind,
  type LayerFlags,
} from "@/lib/viewer-math";
import {
  CG,
  FacadeFace,
  GroundCanopyColumns,
  Mat as FacadeMat,
  TerraceGreen,
  massingFor,
} from "@/components/viewer/cinnagen-facade";

export type CameraPreset = "reset" | "front" | "side" | "top" | "iso";

export interface BuildingSceneProps {
  floors: Floor[];
  stages: Stage[];
  selectedId: string | null;
  onSelect?: (id: string | null) => void;
  hiddenIds: string[];
  exploded: boolean;
  wireframe: boolean;
  transparent: boolean;
  layers: LayerFlags;
  showComplete: boolean;
  simulation: number | null;
  autoRotate?: boolean;
  preset: CameraPreset;
  presetNonce: number;
  compact?: boolean;
  active?: boolean;
  /** حالت هولوگرام فیروزه‌ای شبیه Digital Twin */
  holo?: boolean;
}

const HoloContext = createContext(false);

function Mat({
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
  const holo = useContext(HoloContext);
  if (holo) {
    return (
      <meshStandardMaterial
        color="#22d3ee"
        emissive="#0e7490"
        emissiveIntensity={0.65}
        roughness={0.2}
        metalness={0.75}
        transparent
        opacity={Math.min(0.45, opacity * 0.7)}
        wireframe
      />
    );
  }
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

function Rise({
  amount,
  snap,
  children,
}: {
  amount: number;
  snap?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const value = useRef(Math.max(0.0008, amount));
  const initial = useRef(amount);

  useLayoutEffect(() => {
    const y = Math.max(0.0008, initial.current);
    value.current = y;
    if (ref.current) {
      ref.current.scale.y = y;
      ref.current.visible = y > 0.02;
    }
  }, []);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const target = Math.max(0.0008, amount);
    const next = snap ? target : value.current + (target - value.current) * (1 - Math.exp(-delta * 6.5));
    value.current = next;
    group.scale.y = next;
    group.visible = next > 0.02;
  });

  return <group ref={ref}>{children}</group>;
}

function FloorAnchor({
  base,
  extra,
  hidden,
  snap,
  children,
}: {
  base: number;
  extra: number;
  hidden: boolean;
  snap?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const y = useRef(base + extra);
  const scale = useRef(hidden ? 0.0008 : 1);

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.position.y = y.current;
    ref.current.scale.setScalar(scale.current);
  }, []);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const targetY = hidden ? base - 1.6 : base + extra;
    const targetS = hidden ? 0.0008 : 1;
    const k = snap ? 1 : 1 - Math.exp(-delta * 6);
    y.current += (targetY - y.current) * k;
    scale.current += (targetS - scale.current) * k;
    group.position.y = y.current;
    group.scale.setScalar(Math.max(0.0008, scale.current));
    group.visible = scale.current > 0.03;
  });

  return <group ref={ref}>{children}</group>;
}

function Columns({
  width,
  depth,
  height,
  amount,
  opacity,
  wireframe,
  snap,
}: {
  width: number;
  depth: number;
  height: number;
  amount: number;
  opacity: number;
  wireframe: boolean;
  snap?: boolean;
}) {
  const insetX = 2.6;
  const insetZ = 2.2;
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < 5; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      const x = -width / 2 + insetX + ((width - insetX * 2) * i) / 4;
      const z = -depth / 2 + insetZ + ((depth - insetZ * 2) * j) / 2;
      nodes.push(
        <mesh key={`${i}-${j}`} position={[x, height / 2, z]} castShadow>
          <boxGeometry args={[0.58, height, 0.58]} />
          <Mat color="#6A6661" opacity={opacity} wireframe={wireframe} roughness={0.72} />
        </mesh>,
      );
    }
  }
  return (
    <Rise amount={amount} snap={snap}>
      {nodes}
    </Rise>
  );
}

function Beams({
  width,
  depth,
  height,
  amount,
  opacity,
  wireframe,
  snap,
}: {
  width: number;
  depth: number;
  height: number;
  amount: number;
  opacity: number;
  wireframe: boolean;
  snap?: boolean;
}) {
  const y = height - 0.28;
  const z0 = -depth / 2 + 2.2;
  const z1 = depth / 2 - 2.2;
  const x0 = -width / 2 + 2.6;
  const x1 = width / 2 - 2.6;
  return (
    <Rise amount={amount} snap={snap}>
      {[z0, 0, z1].map((z) => (
        <mesh key={`lx-${z}`} position={[0, y, z]} castShadow>
          <boxGeometry args={[width - 5, 0.38, 0.34]} />
          <Mat color="#7A756F" opacity={opacity} wireframe={wireframe} />
        </mesh>
      ))}
      {[x0, x1].map((x) => (
        <mesh key={`lz-${x}`} position={[x, y, 0]} castShadow>
          <boxGeometry args={[0.34, 0.38, depth - 4]} />
          <Mat color="#7A756F" opacity={opacity} wireframe={wireframe} />
        </mesh>
      ))}
    </Rise>
  );
}

/** هسته عمودی: شفت آسانسور + باکس پله در هر طبقه */
function VerticalCore({
  height,
  amount,
  opacity,
  wireframe,
  transparent,
  kind,
  snap,
}: {
  height: number;
  amount: number;
  opacity: number;
  wireframe: boolean;
  transparent: boolean;
  kind: FloorKind;
  snap?: boolean;
}) {
  const cx = FOOTPRINT.width * 0.18;
  const shell = transparent ? Math.min(opacity, 0.22) : opacity;
  const steps = Math.max(10, Math.round(height / 0.26));
  const riser = height / steps;
  const stairNodes: React.ReactNode[] = [];

  for (let i = 0; i < steps; i += 1) {
    const half = Math.floor(steps / 2);
    const z = i < half ? -1.55 + (i / Math.max(1, half - 1)) * 2.9 : 1.35 - ((i - half) / Math.max(1, steps - half - 1)) * 2.9;
    stairNodes.push(
      <mesh key={`st-${i}`} position={[cx - 1.55, riser * i + riser * 0.5, z]} castShadow>
        <boxGeometry args={[1.65, Math.max(0.07, riser * 0.88), 0.34]} />
        <Mat color={i % 2 ? "#AEA8A0" : "#9C968E"} opacity={shell} wireframe={wireframe} roughness={0.92} />
      </mesh>,
    );
  }

  return (
    <Rise amount={amount} snap={snap}>
      {/* دیوارهای پیرامون هسته (باز برای دیدن داخل) */}
      <mesh position={[cx, height / 2, -2.55]} castShadow>
        <boxGeometry args={[6.4, height, 0.22]} />
        <Mat color="#B3ADA3" opacity={shell} wireframe={wireframe} />
      </mesh>
      <mesh position={[cx, height / 2, 2.55]} castShadow>
        <boxGeometry args={[6.4, height, 0.22]} />
        <Mat color="#B3ADA3" opacity={shell * 0.85} wireframe={wireframe} />
      </mesh>
      <mesh position={[cx - 3.15, height / 2, 0]} castShadow>
        <boxGeometry args={[0.22, height, 5.1]} />
        <Mat color="#B3ADA3" opacity={shell} wireframe={wireframe} />
      </mesh>
      <mesh position={[cx + 3.15, height / 2, 0]} castShadow>
        <boxGeometry args={[0.22, height, 5.1]} />
        <Mat color="#B3ADA3" opacity={shell} wireframe={wireframe} />
      </mesh>
      {/* جداکننده آسانسور / پله */}
      <mesh position={[cx - 0.05, height / 2, 0]} castShadow>
        <boxGeometry args={[0.18, height, 4.8]} />
        <Mat color="#A39D95" opacity={shell} wireframe={wireframe} />
      </mesh>
      {/* شفت آسانسور */}
      <mesh position={[cx + 1.55, height / 2, -1.15]} castShadow>
        <boxGeometry args={[2.5, height, 0.16]} />
        <Mat color="#8A8580" opacity={shell} wireframe={wireframe} />
      </mesh>
      <mesh position={[cx + 1.55, height / 2, 1.15]} castShadow>
        <boxGeometry args={[2.5, height, 0.16]} />
        <Mat color="#8A8580" opacity={shell} wireframe={wireframe} />
      </mesh>
      {!wireframe ? (
        <mesh position={[cx + 2.75, height * 0.45, 0]}>
          <boxGeometry args={[0.05, height * 0.7, 1.9]} />
          <meshStandardMaterial
            color="#C5D8DA"
            transparent
            opacity={0.42 * Math.max(0.35, shell)}
            roughness={0.08}
            metalness={0.35}
          />
        </mesh>
      ) : null}
      {!wireframe && amount > 0.28 ? (
        <mesh position={[cx + 1.55, Math.min(height * 0.42, 1.55), 0]} castShadow>
          <boxGeometry args={[1.9, 2.05, 1.7]} />
          <Mat color="#C87532" opacity={shell} metalness={0.28} roughness={0.45} />
        </mesh>
      ) : null}
      {[-1.0, 1.0].map((z) => (
        <mesh key={`rail-${z}`} position={[cx + 2.7, height * 0.5, z]}>
          <boxGeometry args={[0.07, height * 0.9, 0.07]} />
          <Mat color="#2E2E2C" opacity={shell} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      {stairNodes}
      <mesh position={[cx - 1.55, 0.1, -1.9]} receiveShadow>
        <boxGeometry args={[2.2, 0.12, 1.15]} />
        <Mat color="#C2BBB0" opacity={shell} wireframe={wireframe} />
      </mesh>
      <mesh position={[cx - 1.55, height - 0.1, 1.9]} receiveShadow>
        <boxGeometry args={[2.2, 0.12, 1.15]} />
        <Mat color="#C2BBB0" opacity={shell} wireframe={wireframe} />
      </mesh>
      {/* دست‌انداز پله */}
      <mesh position={[cx - 0.75, height / 2, 0]}>
        <boxGeometry args={[0.06, height * 0.92, 4.2]} />
        <Mat color="#4A4743" opacity={shell * 0.85} metalness={0.25} roughness={0.4} />
      </mesh>
      {/* نشانگر بصری آسانسور (بدون Html برای جلوگیری از race در unmount) */}
      {kind === "ground" && !wireframe ? (
        <mesh position={[cx + 1.55, height + 0.22, 0]}>
          <boxGeometry args={[0.9, 0.18, 0.9]} />
          <Mat color="#C87532" opacity={shell} metalness={0.3} roughness={0.4} />
        </mesh>
      ) : null}
      {kind === "ground" && !wireframe ? (
        <mesh position={[cx - 1.55, height + 0.22, 0]}>
          <boxGeometry args={[0.9, 0.18, 0.9]} />
          <Mat color="#5C584F" opacity={shell} />
        </mesh>
      ) : null}
    </Rise>
  );
}

function FloorModel({
  floor,
  base,
  index,
  count,
  topLevel,
  stages,
  selected,
  dimmed,
  hidden,
  exploded,
  wireframe,
  transparent,
  layers,
  showComplete,
  simulation,
  onSelect,
  snap,
}: {
  floor: Floor;
  base: number;
  index: number;
  count: number;
  topLevel: number;
  stages: Stage[];
  selected: boolean;
  dimmed: boolean;
  hidden: boolean;
  exploded: boolean;
  wireframe: boolean;
  transparent: boolean;
  layers: LayerFlags;
  showComplete: boolean;
  simulation: number | null;
  onSelect?: (id: string | null) => void;
  snap?: boolean;
}) {
  const amounts = visualAmounts({
    simulation,
    index,
    count,
    floor,
    stages,
    showComplete,
    layers,
  });
  const kind = floorKind(floor, topLevel);
  const mass = massingFor(floor.level, kind);
  const width = FOOTPRINT.width * mass.w;
  const depth = FOOTPRINT.depth * mass.d;
  const body = dimmed ? 0.32 : 1;
  const shell = wireframe ? 1 : transparent ? 0.2 : body;
  const bones = wireframe ? 1 : transparent ? 0.85 : body;
  const extra = (exploded ? index * 3.2 : 0) + (selected ? 1.15 : 0);
  const showPipes = amounts.mep > 0.04 && (transparent || wireframe || amounts.walls < 0.62);
  const gear = amounts.equipment > 0.72 ? 3 : amounts.equipment > 0.38 ? 2 : amounts.equipment > 0.06 ? 1 : 0;
  const facadeAmt = Math.max(amounts.walls, amounts.facade * 0.85);
  const holo = useContext(HoloContext);

  return (
    <FloorAnchor base={base} extra={extra} hidden={hidden} snap={snap}>
      <group
        position={[mass.pushX, 0, mass.pushZ]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect?.(selected ? null : floor.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <Rise amount={amounts.slab} snap={snap}>
          <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
            <boxGeometry args={[width, 0.32, depth]} />
            <Mat color={selected ? "#E8D3C0" : "#C8C2B8"} opacity={shell} wireframe={wireframe || holo} />
            {selected || holo ? <Edges color={holo ? "#22d3ee" : "#C87532"} threshold={12} /> : null}
          </mesh>
        </Rise>
        <Columns
          width={width}
          depth={depth}
          height={floor.height}
          amount={amounts.structure}
          opacity={bones}
          wireframe={wireframe}
          snap={snap}
        />
        <Beams
          width={width}
          depth={depth}
          height={floor.height}
          amount={amounts.structure}
          opacity={bones}
          wireframe={wireframe}
          snap={snap}
        />
        <VerticalCore
          height={floor.height}
          amount={amounts.structure}
          opacity={bones}
          wireframe={wireframe}
          transparent={transparent}
          kind={kind}
          snap={snap}
        />
        <Rise amount={facadeAmt} snap={snap}>
          {holo ? (
            <mesh position={[0, floor.height / 2, 0]}>
              <boxGeometry args={[width, floor.height, depth]} />
              <Mat color="#22d3ee" opacity={0.4} wireframe />
            </mesh>
          ) : kind === "roof" ? (
            <group>
              <FacadeFace
                length={width * 0.55}
                height={floor.height * 0.85}
                kind="roof"
                axis="z"
                fixed={depth * 0.22}
                opacity={shell}
                wireframe={wireframe}
                level={floor.level}
              />
              <FacadeFace
                length={width * 0.55}
                height={floor.height * 0.85}
                kind="roof"
                axis="z"
                fixed={-depth * 0.22}
                opacity={shell}
                wireframe={wireframe}
                level={floor.level}
              />
              <mesh position={[0, floor.height * 0.4, depth / 2 - 0.15]} castShadow>
                <boxGeometry args={[width * 0.7, 0.85, 0.22]} />
                <FacadeMat color={CG.panel} opacity={shell} metalness={0.25} roughness={0.45} />
              </mesh>
            </group>
          ) : (
            <group>
              <FacadeFace
                length={width}
                height={floor.height}
                kind={kind}
                axis="z"
                fixed={depth / 2}
                opacity={shell}
                wireframe={wireframe}
                door={kind === "ground"}
                level={floor.level}
              />
              <FacadeFace
                length={width}
                height={floor.height}
                kind={kind}
                axis="z"
                fixed={-depth / 2}
                opacity={shell}
                wireframe={wireframe}
                level={floor.level}
              />
              <FacadeFace
                length={depth}
                height={floor.height}
                kind={kind}
                axis="x"
                fixed={width / 2}
                opacity={shell}
                wireframe={wireframe}
                level={floor.level}
              />
              <FacadeFace
                length={depth}
                height={floor.height}
                kind={kind}
                axis="x"
                fixed={-width / 2}
                opacity={shell}
                wireframe={wireframe}
                level={floor.level}
              />
            </group>
          )}
        </Rise>
        {!holo && kind === "ground" ? (
          <Rise amount={facadeAmt} snap={snap}>
            <GroundCanopyColumns width={width} depth={depth} height={floor.height} opacity={body} amount={amounts.facade} />
            {!wireframe ? (
              <mesh position={[-width * 0.28, floor.height * 0.72, depth / 2 + 0.35]} castShadow>
                <boxGeometry args={[4.2, 0.55, 0.08]} />
                <FacadeMat color="#C0392B" opacity={body} metalness={0.15} roughness={0.55} />
              </mesh>
            ) : null}
          </Rise>
        ) : null}
        {!holo && kind !== "basement" && kind !== "ground" ? (
          <TerraceGreen
            width={width}
            depth={depth}
            y={floor.height}
            opacity={body}
            amount={Math.max(amounts.facade, amounts.finish)}
          />
        ) : null}
        {showPipes ? (
          <Rise amount={amounts.mep} snap={snap}>
            <mesh position={[0, floor.height - 0.7, 1.1]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.07, width - 10, 10]} />
              <meshStandardMaterial color="#31966B" roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, floor.height - 0.95, -0.6]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, width - 10, 10]} />
              <meshStandardMaterial color="#3E6E8C" roughness={0.35} metalness={0.25} />
            </mesh>
          </Rise>
        ) : null}
        {amounts.mep > 0.04 ? (
          <Rise amount={amounts.mep} snap={snap}>
            <mesh position={[width * 0.18 + 3.5, floor.height / 2, 2.7]}>
              <cylinderGeometry args={[0.1, 0.1, floor.height * 0.92, 10]} />
              <meshStandardMaterial color="#C87532" roughness={0.45} metalness={0.25} />
            </mesh>
          </Rise>
        ) : null}
        {floor.level === -1 ? (
          <Rise amount={Math.max(amounts.slab, amounts.structure)} snap={snap}>
            <mesh position={[width * 0.28, 0.55, 0]} rotation={[0, 0, -0.2]}>
              <boxGeometry args={[8.5, 0.14, 3.3]} />
              <Mat color="#A39C92" opacity={shell} wireframe={wireframe} />
            </mesh>
          </Rise>
        ) : null}
        {kind === "roof" && gear > 0 ? (
          <group position={[0, floor.height, 0]}>
            {gear >= 1 ? (
              <mesh position={[-8, 1, 2]} castShadow>
                <boxGeometry args={[5.2, 2, 3]} />
                <Mat color={CG.panelDark} metalness={0.38} roughness={0.42} />
              </mesh>
            ) : null}
            {gear >= 2 ? (
              <mesh position={[-8, 0.55, -2.4]} castShadow>
                <boxGeometry args={[3.4, 1.1, 2.2]} />
                <Mat color={CG.panel} metalness={0.3} roughness={0.48} />
              </mesh>
            ) : null}
            {gear >= 3 ? (
              <mesh position={[10, 1.5, 3]} castShadow>
                <cylinderGeometry args={[0.45, 0.7, 3, 12]} />
                <Mat color={CG.panel} metalness={0.18} roughness={0.5} />
              </mesh>
            ) : null}
          </group>
        ) : null}
        {selected || exploded ? (
          <Html position={[0, floor.height + 0.7, 0]} center distanceFactor={38} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-md border border-accent/30 bg-[#030712]/90 px-2 py-1 text-[11px] text-ink backdrop-blur">
              {floor.name}
            </div>
          </Html>
        ) : null}
      </group>
    </FloorAnchor>
  );
}

function Grade({ y }: { y: number }) {
  const { width, depth } = FOOTPRINT;
  const outerW = 86;
  const outerD = 64;
  const gapW = width + 3.2;
  const gapD = depth + 3.2;
  const sideW = (outerW - gapW) / 2;
  const sideD = (outerD - gapD) / 2;
  const h = 0.24;
  const fenceZ = gapD / 2 + 4.5;
  return (
    <group position={[0, y + 0.12, 0]}>
      <mesh position={[0, 0, gapD / 2 + sideD / 2]} receiveShadow>
        <boxGeometry args={[outerW, h, sideD]} />
        <meshStandardMaterial color="#151d2e" roughness={1} />
      </mesh>
      <mesh position={[0, 0, -(gapD / 2 + sideD / 2)]} receiveShadow>
        <boxGeometry args={[outerW, h, sideD]} />
        <meshStandardMaterial color="#151d2e" roughness={1} />
      </mesh>
      <mesh position={[gapW / 2 + sideW / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[sideW, h, gapD]} />
        <meshStandardMaterial color="#151d2e" roughness={1} />
      </mesh>
      <mesh position={[-(gapW / 2 + sideW / 2), 0, 0]} receiveShadow>
        <boxGeometry args={[sideW, h, gapD]} />
        <meshStandardMaterial color="#151d2e" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, outerD / 2 + 8]}>
        <planeGeometry args={[9, 18]} />
        <meshStandardMaterial color="#0d121c" roughness={0.96} />
      </mesh>
      {/* حصار آجری + نرده فلزی جلوی سایت (شبیه عکس) */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -18 + i * 4.5;
        return (
          <group key={i} position={[x, 0, depth / 2 + depth * 0.08 + 3.2]}>
            <mesh position={[0, 0.85, 0]} castShadow>
              <boxGeometry args={[0.55, 1.7, 0.55]} />
              <FacadeMat color={CG.brick} roughness={0.9} />
            </mesh>
            {i < 8 ? (
              <mesh position={[2.25, 1.15, 0]}>
                <boxGeometry args={[3.8, 0.08, 0.08]} />
                <FacadeMat color={CG.mullion} metalness={0.55} roughness={0.3} />
              </mesh>
            ) : null}
            {i < 8 ? (
              <mesh position={[2.25, 0.7, 0]}>
                <boxGeometry args={[3.8, 0.08, 0.08]} />
                <FacadeMat color={CG.mullion} metalness={0.55} roughness={0.3} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      {/* فضای سبز جلوی ساختمان */}
      {[-10, -4, 3, 10].map((x) => (
        <mesh key={x} position={[x, 0.45, depth / 2 + 5.5]} castShadow>
          <sphereGeometry args={[0.85, 10, 10]} />
          <FacadeMat color={CG.green} roughness={1} />
        </mesh>
      ))}
      <mesh position={[22, 0.05, fenceZ]} receiveShadow>
        <boxGeometry args={[6, 0.1, 4]} />
        <FacadeMat color="#8A8378" />
      </mesh>
    </group>
  );
}

function Pit({ amount, y }: { amount: number; y: number }) {
  const ref = useRef<THREE.Group>(null);
  const value = useRef(amount);
  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    value.current += (amount - value.current) * (1 - Math.exp(-delta * 4));
    group.scale.y = Math.max(0.001, value.current);
    group.visible = value.current > 0.03;
  });
  return (
    <group ref={ref} position={[0, y, 0]}>
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[FOOTPRINT.width + 8, 2.6, FOOTPRINT.depth + 8]} />
        <meshStandardMaterial color="#6E543C" roughness={1} />
      </mesh>
      <mesh position={[FOOTPRINT.width * 0.72, 0.7, 6]}>
        <coneGeometry args={[3.4, 2.1, 6]} />
        <meshStandardMaterial color="#8C6B46" roughness={1} />
      </mesh>
      <mesh position={[-FOOTPRINT.width * 0.66, 0.5, -4]}>
        <coneGeometry args={[2.5, 1.5, 6]} />
        <meshStandardMaterial color="#9A764E" roughness={1} />
      </mesh>
    </group>
  );
}

function presetVectors(preset: CameraPreset, height: number) {
  const target = new THREE.Vector3(0, Math.max(8, height * 0.42), 0);
  const dist = Math.max(56, height * 1.55);
  if (preset === "front") return { pos: new THREE.Vector3(0, target.y + 2, dist), target };
  if (preset === "side") return { pos: new THREE.Vector3(dist, target.y + 1, 0), target };
  if (preset === "top") return { pos: new THREE.Vector3(0.01, dist * 1.35, 0.01), target: new THREE.Vector3(0, 0, 0) };
  return { pos: new THREE.Vector3(dist * 0.78, dist * 0.56, dist * 0.78), target };
}

function CameraRig({ preset, nonce, height }: { preset: CameraPreset; nonce: number; height: number }) {
  const { camera, controls } = useThree();
  const anim = useRef<{
    from: THREE.Vector3;
    to: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    t: number;
  } | null>(null);

  useLayoutEffect(() => {
    const next = presetVectors(preset, height);
    const orbit = controls as { target?: THREE.Vector3 } | null;
    anim.current = {
      from: camera.position.clone(),
      to: next.pos,
      fromTarget: orbit?.target?.clone() ?? new THREE.Vector3(0, height * 0.4, 0),
      toTarget: next.target,
      t: camera.position.distanceTo(next.pos) < 0.4 ? 1 : 0,
    };
  }, [preset, nonce, height, camera, controls]);

  useFrame((_, delta) => {
    const current = anim.current;
    if (!current || current.t >= 1) return;
    current.t = Math.min(1, current.t + delta * 1.35);
    const k = 1 - Math.pow(1 - current.t, 3);
    camera.position.lerpVectors(current.from, current.to, k);
    const orbit = controls as { target?: THREE.Vector3; update?: () => void } | null;
    if (orbit?.target) {
      orbit.target.lerpVectors(current.fromTarget, current.toTarget, k);
      orbit.update?.();
    }
  });

  return null;
}

function SceneBody(props: BuildingSceneProps & { snap?: boolean }) {
  const layout = floorLayout(props.floors);
  const sample = layout.sorted[0];
  const site = sample
    ? visualAmounts({
        simulation: props.simulation,
        index: 0,
        count: layout.sorted.length,
        floor: sample,
        stages: props.stages,
        showComplete: props.showComplete,
        layers: props.layers,
      })
    : null;
  const targetY = Math.max(6, layout.top * 0.38);

  return (
    <>
      <hemisphereLight args={["#9ec9e8", "#1a2333", 0.55]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[32, 48, 24]}
        intensity={1.35}
        castShadow={!props.compact}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.00035}
        shadow-camera-near={2}
        shadow-camera-far={150}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
      />
      <directionalLight position={[-24, 18, -16]} intensity={0.32} color="#D5E4EA" />
      <CameraRig preset={props.preset} nonce={props.presetNonce} height={layout.top} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI * 0.49}
        minDistance={16}
        maxDistance={140}
        autoRotate={props.autoRotate}
        autoRotateSpeed={0.45}
        target={[0, targetY, 0]}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, layout.lowest - 2.5, 0]} receiveShadow>
        <circleGeometry args={[90, 80]} />
        <meshStandardMaterial color="#121926" roughness={1} />
      </mesh>
      <Grid
        position={[0, layout.lowest - 2.48, 0]}
        args={[180, 180]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#1c2740"
        sectionSize={5}
        sectionThickness={1.05}
        sectionColor="#243352"
        fadeDistance={110}
        infiniteGrid
      />
      <Grade y={layout.grade} />
      {site ? <Pit amount={site.excavation} y={layout.grade} /> : null}
      {site ? (
        <group position={[0, layout.lowest - 0.85, 0]}>
          <Rise amount={site.foundation} snap={props.snap}>
            <mesh position={[0, 0.42, 0]} receiveShadow castShadow>
              <boxGeometry args={[FOOTPRINT.width + 2.4, 0.85, FOOTPRINT.depth + 2.4]} />
              <Mat color="#8B857C" roughness={0.92} />
            </mesh>
          </Rise>
        </group>
      ) : null}
      {layout.sorted.map((item) => {
        const place = layout.map.get(item.id);
        if (!place) return null;
        return (
          <FloorModel
            key={item.id}
            floor={item}
            base={place.base}
            index={place.index}
            count={layout.sorted.length}
            topLevel={layout.topLevel}
            stages={props.stages}
            selected={props.selectedId === item.id}
            dimmed={Boolean(props.selectedId && props.selectedId !== item.id)}
            hidden={props.hiddenIds.includes(item.id)}
            exploded={props.exploded}
            wireframe={props.wireframe}
            transparent={props.transparent}
            layers={props.layers}
            showComplete={props.showComplete}
            simulation={props.simulation}
            onSelect={props.onSelect}
            snap={props.snap}
          />
        );
      })}
    </>
  );
}

export default function BuildingScene(props: BuildingSceneProps) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const holo = Boolean(props.holo);
  return (
    <Canvas
      shadows={!props.compact && !holo}
      dpr={props.compact ? [1, 1.25] : [1, 1.7]}
      frameloop={props.active === false ? "never" : "always"}
      camera={{ position: [58, 36, 58], fov: 34, near: 0.1, far: 420 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={[holo ? "#030712" : "#060a12"]} />
      <fog attach="fog" args={[holo ? "#030712" : "#060a12", 70, 170]} />
      <HoloContext.Provider value={holo}>
        <SceneBody {...props} wireframe={holo || props.wireframe} snap={reduce} />
      </HoloContext.Provider>
    </Canvas>
  );
}
