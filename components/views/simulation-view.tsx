"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import { BuildingCanvas } from "@/components/viewer/building-canvas";
import { Meter, StatusPill, ToolButton } from "@/components/ui";
import { faDate, faPercent } from "@/lib/format";
import { useProject } from "@/lib/store";
import { activeStageIndex } from "@/lib/viewer-math";

const layers = { structure: true, walls: true, facade: true, mep: true };

export function SimulationView() {
  const { state } = useProject();
  const stages = [...state.stages].sort((a, b) => a.order - b.order);
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
      tRef.current = Math.min(1, tRef.current + dt * 0.04 * speedRef.current);
      acc += dt;
      if (acc >= 0.08) {
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

  const index = activeStageIndex(t, stages.length);
  const stage = stages[index];

  function jump(nextIndex: number) {
    scrub(stages.length ? nextIndex / stages.length : 0);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 lg:flex-row lg:p-4">
      <aside className="order-2 flex max-h-72 flex-col overflow-hidden border border-line bg-surface lg:order-1 lg:max-h-none lg:h-full lg:w-[340px]">
        <div className="border-b border-line px-4 py-3">
          <div className="text-[11px] text-muted">مرحله فعلی</div>
          <h1 className="mt-1 text-base font-semibold">{stage?.name ?? "—"}</h1>
          <div className="mt-2 flex items-center gap-2">
            {stage ? <StatusPill status={stage.status} /> : null}
            <span className="text-[12px] text-muted">{faPercent(t * 100, 0)} شبیه‌سازی</span>
          </div>
          <div className="mt-3">
            <Meter value={t * 100} />
          </div>
          <p className="mt-3 text-[13px] leading-6 text-muted">{stage?.description}</p>
          {stage ? (
            <div className="mt-3 text-[12px] text-muted">
              {faDate(stage.startDate)} تا {faDate(stage.endDate)}
            </div>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {stages.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => jump(itemIndex)}
              className={`block w-full border-b border-line px-4 py-3 text-right ${itemIndex === index ? "bg-[#F8F1EA]" : "hover:bg-canvas"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{item.name}</span>
                <span className="text-[11px] text-muted">{faPercent(item.progress, 0)}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="order-1 flex min-h-[480px] flex-1 flex-col border border-line bg-[#E6E3DC] lg:order-2">
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
        </div>
        <div className="space-y-3 border-t border-line bg-surface p-3">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(t * 1000)}
            onChange={(event) => scrub(Number(event.target.value) / 1000)}
            className="w-full"
            aria-label="خط زمان ساخت"
          />
          <div className="flex flex-wrap items-center gap-2">
            <ToolButton onClick={() => setPlaying((value) => !value)}>
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
            <ToolButton onClick={() => jump(Math.max(0, index - (t > index / stages.length + 0.02 ? 0 : 1)))}>
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
