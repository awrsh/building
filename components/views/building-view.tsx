"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Eye,
  EyeOff,
  Layers,
  Maximize2,
  RotateCcw,
} from "lucide-react";
import { BuildingCanvas } from "@/components/viewer/building-canvas";
import type { CameraPreset } from "@/components/viewer/building-scene";
import { Meter, StatusPill, ToolButton } from "@/components/ui";
import { faNum, faPercent } from "@/lib/format";
import { useProject } from "@/lib/store";
import type { LayerFlags } from "@/lib/viewer-math";

const ALL_LAYERS: LayerFlags = { structure: true, walls: true, facade: true, mep: true };

export function BuildingView() {
  const { state } = useProject();
  const params = useSearchParams();
  const frame = useRef<HTMLDivElement>(null);
  const floors = [...state.floors].sort((a, b) => a.level - b.level);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [exploded, setExploded] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [layers, setLayers] = useState<LayerFlags>(ALL_LAYERS);
  const [preset, setPreset] = useState<CameraPreset>("iso");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const floor = params.get("floor");
    if (floor && state.floors.some((item) => item.id === floor)) setSelectedId(floor);
  }, [params, state.floors]);

  const selected = floors.find((floor) => floor.id === selectedId) ?? null;

  function look(next: CameraPreset) {
    setPreset(next);
    setNonce((value) => value + 1);
  }

  function toggleLayer(key: keyof LayerFlags) {
    setLayers((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleHidden(id: string) {
    setHiddenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function fullscreen() {
    const node = frame.current;
    if (!node) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await node.requestFullscreen();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3 lg:flex-row lg:p-4">
      <aside className="order-2 flex max-h-80 flex-col overflow-hidden border border-line bg-surface lg:order-1 lg:max-h-none lg:h-full lg:w-80">
        <div className="border-b border-line px-4 py-3">
          <div className="text-sm font-semibold">طبقات</div>
          <p className="mt-1 text-[12px] leading-5 text-muted">برای انتخاب، روی مدل یا فهرست کلیک کنید.</p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {floors.map((floor) => {
            const active = floor.id === selectedId;
            const hidden = hiddenIds.includes(floor.id);
            return (
              <div key={floor.id} className={`flex items-stretch border-b border-line ${active ? "bg-[#F8F1EA]" : ""}`}>
                <button type="button" onClick={() => setSelectedId(active ? null : floor.id)} className="min-w-0 flex-1 px-4 py-3 text-right">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium">{floor.name}</span>
                    <span className="text-[12px] text-muted">{faPercent(floor.progress, 0)}</span>
                  </div>
                  <div className="mt-2">
                    <Meter value={floor.progress} tone={floor.status === "delayed" ? "danger" : "accent"} />
                  </div>
                </button>
                <button
                  type="button"
                  className="grid w-10 place-items-center text-muted hover:text-ink"
                  onClick={() => toggleHidden(floor.id)}
                  aria-label={hidden ? "نمایش طبقه" : "پنهان کردن طبقه"}
                >
                  {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-line p-4">
          {selected ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{selected.name}</div>
                  <div className="text-[12px] text-muted">{selected.program}</div>
                </div>
                <StatusPill status={selected.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <Info label="متراژ" value={`${faNum(selected.area)} م²`} />
                <Info label="ارتفاع" value={`${faNum(selected.height, 1)} م`} />
                <Info label="واحد" value={faNum(selected.units)} />
                <Info label="پیشرفت" value={faPercent(selected.progress, 0)} />
              </div>
              <Trade label="اسکلت" value={selected.structure} />
              <Trade label="دیوارچینی" value={selected.masonry} />
              <Trade label="تأسیسات" value={selected.mep} />
              <Trade label="نازک‌کاری" value={selected.finishing} />
              {selected.notes ? <p className="text-[12px] leading-5 text-muted">{selected.notes}</p> : null}
            </div>
          ) : (
            <p className="text-[12px] leading-5 text-muted">طبقه‌ای انتخاب نشده است.</p>
          )}
        </div>
      </aside>

      <div ref={frame} className="relative order-1 min-h-[440px] flex-1 overflow-hidden border border-line bg-[#E6E3DC] lg:order-2">
        <BuildingCanvas
          floors={state.floors}
          stages={state.stages}
          selectedId={selectedId}
          onSelect={setSelectedId}
          hiddenIds={hiddenIds}
          exploded={exploded}
          wireframe={wireframe}
          transparent={transparent}
          layers={layers}
          showComplete={showComplete}
          simulation={null}
          preset={preset}
          presetNonce={nonce}
        />
        <div className="pointer-events-none absolute inset-3 z-10">
          <span className="absolute top-0 left-0 h-4 w-4 border-t border-l border-ink/30" />
          <span className="absolute top-0 right-0 h-4 w-4 border-t border-r border-ink/30" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-ink/30" />
          <span className="absolute right-0 bottom-0 h-4 w-4 border-r border-b border-ink/30" />
        </div>
        <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap gap-1.5">
          <ToolButton onClick={() => look("reset")} title="بازنشانی دوربین"><RotateCcw size={13} />بازنشانی</ToolButton>
          <ToolButton active={preset === "front"} onClick={() => look("front")}>نما</ToolButton>
          <ToolButton active={preset === "side"} onClick={() => look("side")}>بغل</ToolButton>
          <ToolButton active={preset === "top"} onClick={() => look("top")}>بالا</ToolButton>
          <ToolButton active={preset === "iso"} onClick={() => look("iso")}>ایزومتریک</ToolButton>
          <ToolButton onClick={() => setHiddenIds([])}>نمایش همه</ToolButton>
          <ToolButton onClick={() => setHiddenIds(floors.map((floor) => floor.id))}>پنهان کردن همه</ToolButton>
          <ToolButton active={exploded} onClick={() => setExploded((value) => !value)}><Layers size={13} />انفجاری</ToolButton>
          <ToolButton active={wireframe} onClick={() => setWireframe((value) => !value)}><Box size={13} />وایرفریم</ToolButton>
          <ToolButton active={transparent} onClick={() => setTransparent((value) => !value)}>شفاف</ToolButton>
          <ToolButton active={showComplete} onClick={() => setShowComplete((value) => !value)}>طرح کامل</ToolButton>
          <ToolButton onClick={() => void fullscreen()}><Maximize2 size={13} />تمام‌صفحه</ToolButton>
        </div>
        <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-1.5">
          <ToolButton active={layers.structure} onClick={() => toggleLayer("structure")}>اسکلت</ToolButton>
          <ToolButton active={layers.walls} onClick={() => toggleLayer("walls")}>دیوار</ToolButton>
          <ToolButton active={layers.facade} onClick={() => toggleLayer("facade")}>نما</ToolButton>
          <ToolButton active={layers.mep} onClick={() => toggleLayer("mep")}>تأسیسات</ToolButton>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-2 py-1.5">
      <div className="text-[10px] text-muted">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function Trade({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span>{label}</span>
        <span className="text-muted">{faPercent(value, 0)}</span>
      </div>
      <Meter value={value} tone="ink" />
    </div>
  );
}
