"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BuildingCanvas } from "@/components/viewer/building-canvas";
import { SitePhoto } from "@/components/site-photo";
import { Button, Field, Meter, PageHeader, Panel, StatusPill, controlClass } from "@/components/ui";
import { faNum, faPercent, todayIso, uid } from "@/lib/format";
import { WORK_STATUSES } from "@/lib/labels";
import { useProject } from "@/lib/store";
import type { Floor, WorkStatus } from "@/lib/types";

const layers = { structure: true, walls: true, facade: true, mep: true };

export function FloorView({ embedded = false }: { embedded?: boolean }) {
  const { state, saveFloor, deleteFloor, addLog } = useProject();
  const floors = useMemo(() => [...state.floors].sort((a, b) => a.level - b.level), [state.floors]);
  const [selectedId, setSelectedId] = useState(floors[0]?.id ?? "");
  const selected = floors.find((floor) => floor.id === selectedId) ?? floors[0] ?? null;
  const [draft, setDraft] = useState<Floor | null>(selected);
  const [report, setReport] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const floor = floors.find((item) => item.id === selectedId) ?? floors[0] ?? null;
    if (!floor) {
      setDraft(null);
      return;
    }
    if (floor.id !== selectedId) {
      setSelectedId(floor.id);
      return;
    }
    setDraft({ ...floor });
  }, [selectedId, floors]);

  useEffect(() => {
    setReport("");
    setMessage("");
  }, [selectedId]);

  const images = state.gallery.filter((item) => item.floorId === selected?.id);

  function patch(partial: Partial<Floor>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  function addFloor() {
    const level = floors.reduce((max, floor) => Math.max(max, floor.level), 0) + 1;
    const floor: Floor = {
      id: uid("floor"),
      level,
      name: `طبقه ${faNum(level)}`,
      program: "فضای جدید",
      area: 900,
      height: 3.9,
      units: 0,
      status: "not_started",
      progress: 0,
      structure: 0,
      masonry: 0,
      mep: 0,
      finishing: 0,
      notes: "",
    };
    saveFloor(floor);
    setSelectedId(floor.id);
  }

  return (
    <div className={embedded ? "space-y-4" : "h-full overflow-auto p-4 lg:p-6"}>
      <PageHeader
        title="طبقات"
        description="وضعیت اجرا، گزارش و تصویر هر طبقه. ذخیره، مدل سه‌بعدی را هم به‌روز می‌کند."
        actions={<Button onClick={addFloor}>طبقه جدید</Button>}
      />
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="overflow-hidden">
          {floors.map((floor) => (
            <button
              key={floor.id}
              type="button"
              onClick={() => setSelectedId(floor.id)}
              className={`block w-full border-b border-line px-4 py-3 text-right last:border-b-0 ${floor.id === selected?.id ? "bg-[#F8F1EA]" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{floor.name}</span>
                <StatusPill status={floor.status} />
              </div>
              <div className="mt-1 text-[12px] text-muted">{floor.program}</div>
              <div className="mt-2">
                <Meter value={floor.progress} />
              </div>
            </button>
          ))}
        </Panel>
        {draft && selected ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Panel className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نام">
                  <input className={controlClass} value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
                </Field>
                <Field label="کاربری">
                  <input className={controlClass} value={draft.program} onChange={(event) => patch({ program: event.target.value })} />
                </Field>
                <Field label="شماره تراز">
                  <input className={controlClass} type="number" value={draft.level} onChange={(event) => patch({ level: Number(event.target.value) })} />
                </Field>
                <Field label="متراژ (مترمربع)">
                  <input className={controlClass} type="number" value={draft.area} onChange={(event) => patch({ area: Number(event.target.value) })} />
                </Field>
                <Field label="ارتفاع (متر)">
                  <input className={controlClass} type="number" step="0.1" value={draft.height} onChange={(event) => patch({ height: Number(event.target.value) })} />
                </Field>
                <Field label="تعداد واحد">
                  <input className={controlClass} type="number" value={draft.units} onChange={(event) => patch({ units: Number(event.target.value) })} />
                </Field>
                <Field label="وضعیت">
                  <select className={controlClass} value={draft.status} onChange={(event) => patch({ status: event.target.value as WorkStatus })}>
                    {WORK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === "not_started" ? "شروع‌نشده" : status === "in_progress" ? "در حال اجرا" : status === "completed" ? "تکمیل‌شده" : status === "delayed" ? "دارای تأخیر" : "متوقف"}
                      </option>
                    ))}
                  </select>
                </Field>
                <NumberField label="پیشرفت کل" value={draft.progress} onChange={(progress) => patch({ progress })} />
                <NumberField label="اسکلت" value={draft.structure} onChange={(structure) => patch({ structure })} />
                <NumberField label="دیوارچینی" value={draft.masonry} onChange={(masonry) => patch({ masonry })} />
                <NumberField label="تأسیسات" value={draft.mep} onChange={(mep) => patch({ mep })} />
                <NumberField label="نازک‌کاری" value={draft.finishing} onChange={(finishing) => patch({ finishing })} />
              </div>
              <Field label="یادداشت">
                <textarea className={`${controlClass} h-24 py-2`} value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    saveFloor({
                      ...draft,
                      progress: clamp(draft.progress),
                      structure: clamp(draft.structure),
                      masonry: clamp(draft.masonry),
                      mep: clamp(draft.mep),
                      finishing: clamp(draft.finishing),
                    });
                    setMessage("اطلاعات طبقه ذخیره شد.");
                  }}
                >
                  ذخیره تغییرات
                </Button>
                <Link
                  href={`/building?floor=${selected.id}`}
                  className="inline-flex h-10 items-center justify-center border border-line bg-white px-3.5 text-sm hover:border-ink/30"
                >
                  نمایش در مدل
                </Link>
                <Button
                  tone="danger"
                  onClick={() => {
                    if (floors.length <= 1) return;
                    deleteFloor(selected.id);
                    setSelectedId(floors.find((floor) => floor.id !== selected.id)?.id ?? "");
                  }}
                  disabled={floors.length <= 1}
                >
                  حذف طبقه
                </Button>
              </div>
              {message ? <p className="text-[12px] text-ok">{message}</p> : null}
              <div>
                <div className="mb-2 text-sm font-medium">تصاویر طبقه</div>
                {images.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {images.map((image) => (
                      <div key={image.id} className="aspect-[4/3] overflow-hidden border border-line">
                        <SitePhoto item={image} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-muted">تصویری برای این طبقه ثبت نشده است.</p>
                )}
              </div>
              <Field label="گزارش عملیات">
                <textarea className={`${controlClass} h-20 py-2`} value={report} onChange={(event) => setReport(event.target.value)} placeholder="شرح کار انجام‌شده در این طبقه" />
              </Field>
              <Button
                tone="accent"
                disabled={!report.trim()}
                onClick={() => {
                  addLog({ date: todayIso(), weather: "—", crew: 0, summary: `${selected.name}: ${report.trim()}`, issues: "" });
                  setReport("");
                  setMessage("گزارش در عملیات روزانه ثبت شد.");
                }}
              >
                ثبت گزارش
              </Button>
            </Panel>
            <Panel className="min-h-[320px] overflow-hidden">
              <BuildingCanvas
                floors={[selected]}
                stages={state.stages}
                selectedId={selected.id}
                hiddenIds={[]}
                exploded={false}
                wireframe={false}
                transparent={false}
                layers={layers}
                showComplete={false}
                simulation={null}
                preset="iso"
                presetNonce={0}
                compact
              />
            </Panel>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <Field label={`${label} (${faPercent(value, 0)})`}>
      <input className={controlClass} type="number" min={0} max={100} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
  );
}
