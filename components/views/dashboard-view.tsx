"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProgressChart } from "@/components/charts";
import { BuildingCanvas } from "@/components/viewer/building-canvas";
import { Meter, Panel } from "@/components/ui";
import { faDate, faNum, faPercent, faToman, todayIso } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/labels";
import { isLowStock, progressSeries, snapshot, stockOf } from "@/lib/metrics";
import { useProject } from "@/lib/store";

const layers = { structure: true, walls: true, facade: true, mep: true };

export function DashboardView() {
  const { state } = useProject();
  const view = snapshot(state);
  const [asOf, setAsOf] = useState(state.project.endDate);
  useEffect(() => {
    setAsOf(todayIso());
  }, []);
  const series = progressSeries(state.stages, state.project.startDate, asOf);
  const stages = useMemo(() => [...state.stages].sort((a, b) => a.order - b.order), [state.stages]);
  const topMaterials = useMemo(
    () =>
      [...state.materials]
        .sort((a, b) => b.purchased * b.unitPrice - a.purchased * a.unitPrice)
        .slice(0, 5),
    [state.materials],
  );
  const activeFloor =
    [...state.floors].sort((a, b) => b.progress - a.progress).find((f) => f.status === "in_progress") ?? state.floors[0];
  const crew = state.logs[0]?.crew ?? 60;
  const spentPct = view.budget ? (view.spent / view.budget) * 100 : 0;

  return (
    <div className="h-full overflow-auto p-3 lg:p-4">
      <div className="mx-auto grid max-w-[1600px] gap-3 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]">
        {/* مایلستون / تایم‌لاین */}
        <div className="flex flex-col gap-3">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] text-accent">PROJECT TIMELINES</h2>
              <span className="text-[10px] text-muted">{faNum(stages.length)} مرحله</span>
            </div>
            <div className="mb-3 flex gap-1">
              {["Q1", "Q2", "Q3"].map((q, i) => (
                <span
                  key={q}
                  className={`rounded-md px-2 py-0.5 text-[10px] ${i === 1 ? "bg-accent/20 text-accent" : "bg-white/5 text-muted"}`}
                >
                  {q}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              {stages.slice(0, 5).map((stage) => (
                <div key={stage.id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                    <span className="truncate text-ink/90">{stage.name}</span>
                    <span className="text-accent">{faPercent(stage.progress, 0)}</span>
                  </div>
                  <Meter value={stage.progress} tone="gradient" />
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniStat label="Completed" value={faPercent((view.completedStages / Math.max(1, stages.length)) * 100, 0)} />
              <MiniStat label="In Progress" value={faPercent((view.activeStages / Math.max(1, stages.length)) * 100, 0)} />
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] text-accent">GANTT</h2>
              <Link href="/timeline" className="text-[10px] text-muted hover:text-accent">
                کامل
              </Link>
            </div>
            <div className="space-y-2">
              {stages.slice(0, 7).map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-2">
                  <span className="w-3 text-[9px] text-muted">{faNum(index + 1)}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="absolute inset-y-0 right-0 rounded-full meter-gradient"
                      style={{ width: `${Math.max(10, stage.progress)}%`, marginRight: `${(index % 3) * 6}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 h-24">
              <ProgressChart points={series.slice(-10)} />
            </div>
          </Panel>
        </div>

        {/* مرکز Digital Twin */}
        <Panel className="relative flex min-h-[560px] flex-col overflow-hidden glow-cyan lg:min-h-[640px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
            <div className="rounded-xl border border-accent/25 bg-[#030712]/80 px-3 py-2 backdrop-blur">
              <div className="text-[10px] tracking-[0.16em] text-accent">DIGITAL TWIN</div>
              <div className="mt-0.5 text-[13px] font-semibold">{state.project.name}</div>
              <div className="mt-1 text-[10px] text-muted">
                {state.project.code} · {faPercent(view.progress, 0)}
              </div>
            </div>
            <div className="pointer-events-auto flex flex-col items-end gap-1.5">
              {activeFloor ? (
                <div className="rounded-lg border border-ok/40 bg-ok/10 px-2.5 py-1.5 text-[10px] text-ok shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                  {activeFloor.name} · Active {faPercent(activeFloor.progress, 0)}
                </div>
              ) : null}
              <div className="flex gap-1.5">
                <Link
                  href="/simulation"
                  className="rounded-lg border border-accent/40 bg-accent/15 px-2.5 py-1.5 text-[11px] text-accent shadow-[0_0_14px_rgba(34,211,238,0.2)]"
                >
                  پخش ساخت
                </Link>
                <Link href="/building" className="rounded-lg border border-line bg-white/5 px-2.5 py-1.5 text-[11px] text-ink hover:border-accent/40">
                  مدل کامل
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] flex-1 bg-[#030712] lg:min-h-[480px]">
            <BuildingCanvas
              floors={state.floors}
              stages={state.stages}
              selectedId={null}
              hiddenIds={[]}
              exploded={false}
              wireframe
              transparent
              layers={layers}
              showComplete={false}
              simulation={null}
              autoRotate
              preset="iso"
              presetNonce={0}
              compact
              holo
            />
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-accent/15 bg-[#030712]/90 p-3">
            {state.floors
              .filter((f) => f.level >= 0)
              .slice(0, 3)
              .map((floor) => (
                <div
                  key={floor.id}
                  className="rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 shadow-[0_0_20px_rgba(34,211,238,0.08)]"
                  style={{ transform: "perspective(400px) rotateX(8deg)" }}
                >
                  <div className="text-[10px] text-accent">Level {faNum(floor.level)} Plan</div>
                  <div className="mt-0.5 truncate text-[11px] text-muted">{floor.name}</div>
                  <div className="mt-1.5">
                    <Meter value={floor.progress} tone="gradient" />
                  </div>
                </div>
              ))}
          </div>
        </Panel>

        {/* منابع */}
        <div className="flex flex-col gap-3 lg:col-span-2 xl:col-span-1">
          <Panel className="p-4">
            <h2 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-accent">RESOURCE ALLOCATION</h2>
            <div className="flex items-center gap-4">
              <Ring value={view.progress} label={`${faNum(crew)}`} sub="Workers" />
              <div className="min-w-0 flex-1 space-y-2 text-[11px]">
                <Row label="Project Completion" value={faPercent(view.progress, 0)} />
                <Row label="Budget Spent" value={faPercent(spentPct, 0)} />
                <Row
                  label="Schedule Deviation"
                  value={view.delayedStages ? `${faNum(view.delayedStages)} مرحله` : "On Track"}
                />
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <h2 className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-accent">MATERIALS</h2>
            <div className="space-y-3">
              {topMaterials.slice(0, 4).map((item) => {
                const used = item.required ? Math.min(100, (item.consumed / item.required) * 100) : 0;
                return (
                  <div key={item.id}>
                    <div className="mb-1 flex justify-between text-[11px]">
                      <span className={isLowStock(item) ? "text-danger" : "text-ink/90"}>{item.name}</span>
                      <span className="text-accent">{faPercent(used, 0)}</span>
                    </div>
                    <Meter value={used} tone={isLowStock(item) ? "danger" : "gradient"} />
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="overflow-hidden p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] text-accent">TABLE VIEW</h2>
              <Link href="/materials" className="text-[10px] text-muted hover:text-accent">
                انبار
              </Link>
            </div>
            <table className="w-full text-right text-[11px]">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">Used</th>
                </tr>
              </thead>
              <tbody>
                {topMaterials.map((item, i) => (
                  <tr key={item.id} className="border-b border-line/50">
                    <td className="py-2">
                      <span
                        className="ml-1.5 inline-block h-1.5 w-1.5 rounded-sm"
                        style={{ background: ["#22d3ee", "#a855f7", "#34d399", "#fbbf24", "#38bdf8"][i % 5] }}
                      />
                      {item.name}
                    </td>
                    <td className="py-2 text-muted">{faNum(stockOf(item))}</td>
                    <td className="py-2 text-muted">{faNum(item.consumed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <MiniStat label="Budget" value={faToman(view.budget)} />
              <MiniStat label="Spent" value={faToman(view.spent)} />
            </div>
            <div className="mt-2 text-[10px] text-muted">
              {faDate(asOf)} · {STATUS_LABEL[state.project.status]}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-accent/15 bg-accent/5 px-2.5 py-2">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="mt-0.5 text-[12px] font-semibold tracking-tight text-ink">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-accent">{value}</span>
    </div>
  );
}

function Ring({ value, label, sub }: { value: number; label: string; sub: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  return (
    <div className="relative grid h-[92px] w-[92px] shrink-0 place-items-center">
      <svg width="92" height="92" className="-rotate-90">
        <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke="url(#ringGrad2)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ringGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[13px] font-semibold text-accent">{label}</div>
          <div className="text-[9px] text-muted">{sub}</div>
        </div>
      </div>
    </div>
  );
}
