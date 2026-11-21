"use client";

import { Edges, Grid, Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Floor, Stage } from "@/lib/types";
import {
  FOOTPRINT,
  floorKind,
  floorLayout,
  mixHex,
  visualAmounts,
  wallColor,
  type FloorKind,
  type LayerFlags,
} from "@/lib/viewer-math";

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
}

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
    const next = snap ? target : value.current + (target - value.current) * (1 - Math.exp(-delta * 5));
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

function at(axis: "x" | "z", along: number, y: number, fixed: number): [number, number, number] {
  return axis === "z" ? [along, y, fixed] : [fixed, y, along];
}

function dims(axis: "x" | "z", along: number, y: number, thick: number): [number, number, number] {
  return axis === "z" ? [along, y, thick] : [thick, y, along];
}

function WallRun({
  length,
  height,
  kind,
  axis,
  fixed,
  amount,
  color,
  facade,
  opacity,
  wireframe,
  door,
  snap,
}: {
  length: number;
  height: number;
  kind: FloorKind;
  axis: "x" | "z";
  fixed: number;
  amount: number;
  color: string;
  facade: number;
  opacity: number;
  wireframe: boolean;
  door?: boolean;
  snap?: boolean;
}) {
  const bays = kind === "ground" ? 9 : kind === "roof" ? 7 : kind === "basement" ? 8 : 12;
  const bay = length / bays;
  const pier = kind === "ground" ? 0.14 : 0.18;
  const thick = 0.22;
  const glassH =
    kind === "ground" ? height * 0.68 : kind === "basement" ? height * 0.14 : kind === "roof" ? height * 0.26 : height * 0.48;
  const glassBase =
    kind === "ground" ? height * 0.1 : kind === "basement" ? height * 0.66 : kind === "roof" ? height * 0.52 : height * 0.32;
  const pierColor = facade > 0.5 && kind !== "basement" ? "#C87532" : kind === "ground" ? "#343432" : color;
  const nodes: React.ReactNode[] = [];

  for (let index = 0; index < bays; index += 1) {
    const along = -length / 2 + bay * index + pier / 2;
    const center = -length / 2 + bay * index + bay / 2;
    const isDoor = Boolean(door && index === Math.floor(bays / 2));
    nodes.push(
      <mesh key={`p-${axis}-${fixed}-${index}`} position={at(axis, along, height / 2, fixed)} castShadow>
        <boxGeometry args={dims(axis, pier, height, thick)} />
        <Mat color={pierColor} opacity={opacity} wireframe={wireframe} roughness={0.6} />
      </mesh>,
    );
    if (!wireframe && !isDoor && kind !== "basement") {
      nodes.push(
        <mesh key={`g-${axis}-${fixed}-${index}`} position={at(axis, center, glassBase + glassH / 2, fixed)}>
          <boxGeometry args={dims(axis, Math.max(0.18, bay - pier - 0.12), glassH, 0.045)} />
          <meshStandardMaterial
            color={facade > 0.45 ? "#CFE3E2" : "#B7D4D6"}
            transparent
            opacity={0.4 * opacity}
            roughness={0.05}
            metalness={0.28}
          />
        </mesh>,
      );
    }
    if (!wireframe && kind === "basement") {
      nodes.push(
        <mesh key={`s-${axis}-${fixed}-${index}`} position={at(axis, center, height * 0.72, fixed)}>
          <boxGeometry args={dims(axis, bay * 0.42, height * 0.1, 0.05)} />
          <meshStandardMaterial color="#93B0AE" transparent opacity={0.5 * opacity} roughness={0.14} />
        </mesh>,
      );
    }
    if (isDoor && !wireframe) {
      nodes.push(
        <mesh key={`d-${axis}-${fixed}`} position={at(axis, center, 1.3, fixed)}>
          <boxGeometry args={dims(axis, Math.max(0.9, bay - pier - 0.25), 2.6, 0.08)} />
          <Mat color="#262624" opacity={opacity} roughness={0.42} metalness={0.18} />
        </mesh>,
      );
    }
  }

  nodes.push(
    <mesh key={`band-${axis}-${fixed}`} position={at(axis, 0, height - 0.15, fixed)} castShadow>
      <boxGeometry args={dims(axis, length, 0.3, thick + 0.05)} />
      <Mat color={color} opacity={opacity} wireframe={wireframe} />
    </mesh>,
  );

  return (
    <Rise amount={amount} snap={snap}>
      {nodes}
    </Rise>
  );
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
  const { width, depth } = FOOTPRINT;
  const body = dimmed ? 0.32 : 1;
  const shell = wireframe ? 1 : transparent ? 0.2 : body;
  const bones = wireframe ? 1 : transparent ? 0.85 : body;
  const color = selected ? mixHex(wallColor(kind, amounts.finish, amounts.facade), "#E7B48A", 0.35) : wallColor(kind, amounts.finish, amounts.facade);
  const extra = (exploded ? index * 3.2 : 0) + (selected ? 1.15 : 0);
  const showPipes = amounts.mep > 0.04 && (transparent || wireframe || amounts.walls < 0.62);
  const gear = amounts.equipment > 0.72 ? 3 : amounts.equipment > 0.38 ? 2 : amounts.equipment > 0.06 ? 1 : 0;

  return (
    <FloorAnchor base={base} extra={extra} hidden={hidden} snap={snap}>
      <group
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
            <Mat color={selected ? "#E8D3C0" : "#D0CAC0"} opacity={shell} wireframe={wireframe} />
            {selected && !wireframe ? <Edges color="#C87532" threshold={12} /> : null}
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
        <Rise amount={amounts.structure} snap={snap}>
          <mesh position={[width * 0.18, floor.height / 2, 0]} castShadow>
            <boxGeometry args={[6.4, floor.height, 5.1]} />
            <Mat color="#B3ADA3" opacity={transparent ? 0.16 : bones} wireframe={wireframe} />
          </mesh>
        </Rise>
        {kind === "roof" ? (
          <group>
            <WallRun
              length={width * 0.46}
              height={floor.height * 0.82}
              kind="roof"
              axis="z"
              fixed={depth * 0.18}
              amount={Math.max(amounts.walls, amounts.structure * 0.85)}
              color={color}
              facade={amounts.facade}
              opacity={shell}
              wireframe={wireframe}
              snap={snap}
            />
            <WallRun
              length={width * 0.46}
              height={floor.height * 0.82}
              kind="roof"
              axis="z"
              fixed={-depth * 0.18}
              amount={Math.max(amounts.walls, amounts.structure * 0.85)}
              color={color}
              facade={amounts.facade}
              opacity={shell}
              wireframe={wireframe}
              snap={snap}
            />
            <Rise amount={amounts.slab} snap={snap}>
              <mesh position={[0, floor.height * 0.42, depth / 2 - 0.2]}>
                <boxGeometry args={[width, 0.9, 0.28]} />
                <Mat color="#C9C3B8" opacity={shell} wireframe={wireframe} />
              </mesh>
              <mesh position={[0, floor.height * 0.42, -depth / 2 + 0.2]}>
                <boxGeometry args={[width, 0.9, 0.28]} />
                <Mat color="#C9C3B8" opacity={shell} wireframe={wireframe} />
              </mesh>
            </Rise>
          </group>
        ) : (
          <group>
            <WallRun
              length={width}
              height={floor.height}
              kind={kind}
              axis="z"
              fixed={depth / 2}
              amount={amounts.walls}
              color={color}
              facade={amounts.facade}
              opacity={shell}
              wireframe={wireframe}
              door={kind === "ground"}
              snap={snap}
            />
            <WallRun
              length={width}
              height={floor.height}
              kind={kind}
              axis="z"
              fixed={-depth / 2}
              amount={amounts.walls}
              color={color}
              facade={amounts.facade}
              opacity={shell}
              wireframe={wireframe}
              snap={snap}
            />
            <WallRun
              length={depth}
              height={floor.height}
              kind={kind}
              axis="x"
              fixed={width / 2}
              amount={amounts.walls}
              color={color}
              facade={amounts.facade}
              opacity={shell}
              wireframe={wireframe}
              snap={snap}
            />
            <WallRun
              length={depth}
              height={floor.height}
              kind={kind}
              axis="x"
              fixed={-width / 2}
              amount={amounts.walls}
              color={color}
              facade={amounts.facade}
              opacity={shell}
              wireframe={wireframe}
              snap={snap}
            />
          </group>
        )}
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
        {kind === "ground" ? (
          <Rise amount={amounts.facade} snap={snap}>
            <mesh position={[0, 3.25, depth / 2 + 1.6]}>
              <boxGeometry args={[9, 0.12, 3.1]} />
              <Mat color="#C87532" opacity={body} metalness={0.32} roughness={0.42} />
            </mesh>
            {[-3.8, 3.8].map((x) => (
              <mesh key={x} position={[x, 1.6, depth / 2 + 2.7]}>
                <boxGeometry args={[0.14, 3.2, 0.14]} />
                <Mat color="#2E2E2C" opacity={body} />
              </mesh>
            ))}
          </Rise>
        ) : null}
        {kind === "roof" && gear > 0 ? (
          <group position={[0, floor.height, 0]}>
            {gear >= 1 ? (
              <mesh position={[-8, 1, 2]} castShadow>
                <boxGeometry args={[5.2, 2, 3]} />
                <Mat color="#8E9491" metalness={0.38} roughness={0.42} />
              </mesh>
            ) : null}
            {gear >= 2 ? (
              <mesh position={[-8, 0.55, -2.4]} castShadow>
                <boxGeometry args={[3.4, 1.1, 2.2]} />
                <Mat color="#B0B5B2" metalness={0.3} roughness={0.48} />
              </mesh>
            ) : null}
            {gear >= 3 ? (
              <mesh position={[10, 1.5, 3]} castShadow>
                <cylinderGeometry args={[0.45, 0.7, 3, 12]} />
                <Mat color="#D0CBC2" metalness={0.18} roughness={0.5} />
              </mesh>
            ) : null}
          </group>
        ) : null}
        {selected || exploded ? (
          <Html position={[0, floor.height + 0.7, 0]} center distanceFactor={38} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap border border-ink/10 bg-white/92 px-2 py-1 text-[11px] text-ink">
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
  return (
    <group position={[0, y + 0.12, 0]}>
      <mesh position={[0, 0, gapD / 2 + sideD / 2]} receiveShadow>
        <boxGeometry args={[outerW, h, sideD]} />
        <meshStandardMaterial color="#D9D3C8" roughness={1} />
      </mesh>
      <mesh position={[0, 0, -(gapD / 2 + sideD / 2)]} receiveShadow>
        <boxGeometry args={[outerW, h, sideD]} />
        <meshStandardMaterial color="#D9D3C8" roughness={1} />
      </mesh>
      <mesh position={[gapW / 2 + sideW / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[sideW, h, gapD]} />
        <meshStandardMaterial color="#D9D3C8" roughness={1} />
      </mesh>
      <mesh position={[-(gapW / 2 + sideW / 2), 0, 0]} receiveShadow>
        <boxGeometry args={[sideW, h, gapD]} />
        <meshStandardMaterial color="#D9D3C8" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, outerD / 2 + 8]}>
        <planeGeometry args={[9, 18]} />
        <meshStandardMaterial color="#3C3C3A" roughness={0.96} />
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
        floor: sample.floor,
        stages: props.stages,
        showComplete: props.showComplete,
        layers: props.layers,
      })
    : null;
  const targetY = Math.max(6, layout.top * 0.38);

  return (
    <>
      <hemisphereLight args={["#F7F4EE", "#B7A894", 0.72]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[32, 48, 24]}
        intensity={1.55}
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
        <meshStandardMaterial color="#E7E2D8" roughness={1} />
      </mesh>
      <Grid
        position={[0, layout.lowest - 2.48, 0]}
        args={[180, 180]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#DDD6CB"
        sectionSize={5}
        sectionThickness={1.05}
        sectionColor="#CDBCA8"
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
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <Canvas
      shadows={!props.compact}
      dpr={props.compact ? [1, 1.25] : [1, 1.7]}
      frameloop={props.active === false ? "never" : "always"}
      camera={{ position: [58, 36, 58], fov: 34, near: 0.1, far: 420 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={["#E6E3DC"]} />
      <fog attach="fog" args={["#E6E3DC", 78, 180]} />
      <SceneBody {...props} snap={reduce} />
    </Canvas>
  );
}
