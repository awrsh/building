"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { BuildingCanvas } from "@/components/viewer/building-canvas";
import { Meter, StatusPill, ToolButton } from "@/components/ui";
import { faDate, faNum, faPercent } from "@/lib/format";
import { useProject } from "@/lib/store";
import {
  activeStageIndex,
  simulationCalendarRange,
  simulationDateAt,
  stageLocalAt,
  stageStartT,
  stageWindow,
} from "@/lib/viewer-math";

const layers = { structure: true, walls: true, facade: true, mep: true };

const BAR: Record<string, string> = {
  completed: "bg-ok",
  in_progress: "bg-accent",
  delayed: "bg-danger",
  on_hold: "bg-warn",
  not_started: "bg-white/30",
};

export function SimulationView() {
  const { state } = useProject();
  const stages = useMemo(() => [...state.stages].sort((a, b) => a.order - b.order), [state.stages]);
  const range = useMemo(() => simulationCalendarRange(stages), [stages]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const tRef = useRef(0);
  const speedRef = useRef(1);
  speedRef.current = speed;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // یک چرخه کامل ≈ مدت واقعی پروژه روی گانت (با مقیاس فشرده)
      tRef.current = Math.min(1, tRef.current + dt * 0.035 * speedRef.current);
      acc += dt;
      if (acc >= 0.05) {
        acc = 0;
        setT(tRef.current);
      }
      if (tRef.current >= 1) {
        setT(1);
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  function scrub(value: number) {
    const next = Math.min(1, Math.max(0, value));
    tRef.current = next;
    setT(next);
  }

  const index = activeStageIndex(t, stages);
  const stage = stages[index];
  const stageLocal = stage ? stageLocalAt(t, stage, stages) : 0;
  const simDate = stages.length ? simulationDateAt(t, stages) : "";
  const windows = useMemo(
    () =>
      stages.map((item) => ({
        stage: item,
        window: stageWindow(stages, item.id) ?? { a: 0, b: 0 },
      })),
    [stages],
  );

  function jump(nextIndex: number) {
    const target = stages[nextIndex];
    if (!target) return;
    scrub(stageStartT(stages, target.id));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3 lg:flex-row lg:p-4">
      <aside className="order-2 flex min-h-0 flex-1 flex-col overflow-hidden border border-line bg-surface lg:order-1 lg:h-full lg:w-[340px] lg:flex-none">
        <div className="border-b border-line px-4 py-3">
          <div className="text-[11px] text-muted">
            مرحله · {faNum(index + 1)} / {faNum(stages.length)} · هم‌تراز گانت
          </div>
          <h1 className="mt-1 text-base font-semibold">{stage?.name ?? "—"}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {stage ? <StatusPill status={stage.status} /> : null}
            <span className="text-[12px] text-muted">
              {faPercent(t * 100, 0)} کل · {faPercent(stageLocal * 100, 0)} مرحله
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <Meter value={t * 100} />
            <Meter value={stageLocal * 100} />
          </div>
          <p className="mt-3 hidden text-[13px] leading-6 text-muted sm:block">{stage?.description}</p>
          {stage ? (
            <div className="mt-3 space-y-1 text-[12px] text-muted">
              <div>
                گانت: {faDate(stage.startDate)} تا {faDate(stage.endDate)}
              </div>
              {simDate ? <div className="text-ink">تاریخ شبیه‌سازی: {faDate(simDate)}</div> : null}
            </div>
          ) : null}
          <Link href="/timeline" className="mt-3 inline-block text-[12px] text-accent hover:underline">
            ویرایش زمان‌بندی گانت
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {stages.map((item, itemIndex) => {
            const local = stageLocalAt(t, item, stages);
            const done = local >= 0.92 || (itemIndex < index && local <= 0);
            const active = itemIndex === index;
            const win = stageWindow(stages, item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => jump(itemIndex)}
                className={`block w-full border-b border-line px-4 py-3 text-right ${
                  active ? "bg-[#F8F1EA]" : "hover:bg-canvas"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-[11px] text-muted">
                    {active ? faPercent(local * 100, 0) : done ? "✓" : faPercent(item.progress, 0)}
                  </span>
                </div>
                {win ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                    <div
                      className={`h-full rounded-full ${active ? "bg-accent" : done ? "bg-ok" : "bg-black/15"}`}
                      style={{ width: `${Math.max(4, local * 100)}%` }}
                    />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      <div className="order-1 flex h-[48dvh] min-h-[260px] shrink-0 flex-col border border-line bg-[#E6E3DC] sm:h-[52dvh] lg:order-2 lg:h-auto lg:min-h-0 lg:flex-1">
        <div className="relative min-h-0 flex-1">
          <BuildingCanvas
            floors={state.floors}
            stages={state.stages}
            selectedId={null}
            hiddenIds={[]}
            exploded={false}
            wireframe={false}
            transparent={false}
            layers={layers}
            showComplete={false}
            simulation={t}
            preset="iso"
            presetNonce={0}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-2 p-2 sm:p-3">
            <div className="rounded-xl border border-line bg-surface/90 px-3 py-2 backdrop-blur">
              <div className="text-[11px] text-muted">شبیه‌سازی بر اساس گانت</div>
              <div className="mt-0.5 text-sm font-semibold text-ink">{stage?.name ?? "آماده‌سازی"}</div>
              <div className="mt-1 text-[12px] text-muted">
                {simDate ? faDate(simDate) : "—"} · {faNum(range.totalDays)} روز پروژه
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2 border-t border-line bg-surface p-2 sm:space-y-3 sm:p-3">
          <div className="relative h-10 overflow-hidden rounded-lg border border-line bg-canvas">
            {windows.map(({ stage: item, window }) => (
              <button
                key={item.id}
                type="button"
                title={`${item.name} · ${faDate(item.startDate)} → ${faDate(item.endDate)}`}
                onClick={() => scrub(window.a)}
                className={`absolute top-1.5 h-7 rounded-sm opacity-80 transition hover:opacity-100 ${BAR[item.status] ?? "bg-accent"}`}
                style={{
                  right: `${window.a * 100}%`,
                  width: `${Math.max(1.2, (window.b - window.a) * 100)}%`,
                }}
              />
            ))}
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-ink"
              style={{ right: `${t * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted">
            <span>{faDate(range.start)}</span>
            <span>{simDate ? faDate(simDate) : "—"}</span>
            <span>{faDate(range.end)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(t * 1000)}
            onChange={(event) => scrub(Number(event.target.value) / 1000)}
            className="w-full"
            aria-label="خط زمان گانت ساخت"
          />
          <div className="flex flex-wrap items-center gap-2">
            <ToolButton
              onClick={() => {
                if (!playing && t >= 1) scrub(0);
                setPlaying((value) => !value);
              }}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? "مکث" : "پخش"}
            </ToolButton>
            <ToolButton
              onClick={() => {
                setPlaying(false);
                scrub(0);
              }}
            >
              <Square size={13} />
              توقف
            </ToolButton>
            <ToolButton
              onClick={() => {
                const prev = Math.max(0, index - (stageLocal > 0.02 ? 0 : 1));
                jump(prev);
              }}
            >
              <SkipForward size={13} />
              مرحله قبل
            </ToolButton>
            <ToolButton onClick={() => jump(Math.min(stages.length - 1, index + 1))}>
              <SkipBack size={13} />
              مرحله بعد
            </ToolButton>
            <label className="mr-auto flex items-center gap-2 text-[12px] text-muted">
              سرعت
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="h-8 border border-line bg-white px-2 text-ink"
              >
                <option value={0.5}>۰٫۵×</option>
                <option value={1}>۱×</option>
                <option value={2}>۲×</option>
                <option value={4}>۴×</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
