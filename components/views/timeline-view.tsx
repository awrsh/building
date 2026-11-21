"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Field, Modal, PageHeader, Panel, StatusPill, controlClass } from "@/components/ui";
import { faDate, faNum, faPercent, todayIso, uid } from "@/lib/format";
import { PRIORITIES, PRIORITY_LABEL, STATUS_LABEL, WORK_STATUSES } from "@/lib/labels";
import { plannedProgress } from "@/lib/metrics";
import { useProject } from "@/lib/store";
import type { Priority, Stage, WorkStatus } from "@/lib/types";

type Zoom = "day" | "week" | "month";

const PX: Record<Zoom, number> = { day: 22, week: 8, month: 2.6 };
const BAR: Record<WorkStatus, string> = {
  completed: "bg-ok",
  in_progress: "bg-accent",
  delayed: "bg-danger",
  on_hold: "bg-warn",
  not_started: "bg-[#C8C2B8]",
};

function daysFrom(start: string, end: string) {
  return Math.round((Date.parse(end.slice(0, 10)) - Date.parse(start.slice(0, 10))) / 86_400_000);
}

function monthsBetween(start: string, end: string) {
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`);
  const last = Date.parse(end.slice(0, 10));
  const items: string[] = [];
  while (cursor.getTime() <= last) {
    items.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return items;
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

const emptyStage = (): Stage => {
  const start = todayIso();
  return {
    id: uid("stage"),
    order: 1,
    name: "مرحله جدید",
    description: "",
    startDate: start,
    endDate: addDays(start, 30),
    progress: 0,
    status: "not_started",
    priority: "medium",
    dependsOn: [],
    delayDays: 0,
  };
};

export function TimelineView({ embedded = false }: { embedded?: boolean }) {
  const { state, saveStage, deleteStage } = useProject();
  const stages = useMemo(() => [...state.stages].sort((a, b) => a.order - b.order), [state.stages]);
  const [zoom, setZoom] = useState<Zoom>("week");
  const [today, setToday] = useState("");
  const [draft, setDraft] = useState<Stage | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  }, []);

  const rangeStart = [state.project.startDate, ...stages.map((stage) => stage.startDate)].sort()[0] ?? state.project.startDate;
  const rangeEnd = [state.project.endDate, ...stages.map((stage) => stage.endDate)].sort().at(-1) ?? state.project.endDate;
  const totalDays = Math.max(1, daysFrom(rangeStart, rangeEnd));
  const width = totalDays * PX[zoom];
  const months = monthsBetween(rangeStart, rangeEnd);

  return (
    <div className={embedded ? "space-y-4" : "h-full overflow-auto p-4 lg:p-6"}>
      <PageHeader
        title="زمان‌بندی ساخت"
        description={
          <>
            نمای روزانه، هفتگی و ماهانه با وابستگی و تأخیر.{" "}
            <Link href="/simulation" className="text-accent hover:underline">شبیه‌سازی سه‌بعدی</Link>
          </>
        }
        actions={
          <>
            {(["day", "week", "month"] as Zoom[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setZoom(item)}
                className={`h-9 border px-3 text-[13px] ${zoom === item ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}
              >
                {item === "day" ? "روزانه" : item === "week" ? "هفتگی" : "ماهانه"}
              </button>
            ))}
            <Button
              onClick={() => {
                const stage = emptyStage();
                stage.order = stages.reduce((max, item) => Math.max(max, item.order), 0) + 1;
                setDraft(stage);
              }}
            >
              مرحله جدید
            </Button>
          </>
        }
      />

      <Panel className="overflow-auto">
        {!stages.length ? (
          <div className="p-6 text-center text-sm text-muted">هنوز مرحله‌ای تعریف نشده است. از «مرحله جدید» شروع کنید.</div>
        ) : null}
        <div className={`flex min-w-full ${stages.length ? "" : "hidden"}`}>
          <div className="sticky right-0 z-10 w-60 shrink-0 border-l border-line bg-surface">
            <div className="h-12 border-b border-line px-3 py-3 text-[12px] text-muted">فعالیت</div>
            {stages.map((stage) => (
              <button key={stage.id} type="button" onClick={() => setDraft(stage)} className="block h-16 w-full border-b border-line px-3 py-2 text-right hover:bg-canvas">
                <div className="truncate text-sm">{stage.name}</div>
                <div className="mt-1 text-[11px] text-muted">{PRIORITY_LABEL[stage.priority]}</div>
              </button>
            ))}
          </div>
          <div className="relative" style={{ width }}>
            <div className="relative h-12 border-b border-line">
              {months.map((month, index) => {
                const next = months[index + 1] ?? rangeEnd;
                const span = Math.max(1, daysFrom(month, next));
                return (
                  <div
                    key={month}
                    className="absolute top-0 flex h-12 items-center border-l border-line px-2 text-[11px] text-muted"
                    style={{ right: daysFrom(rangeStart, month) * PX[zoom], width: span * PX[zoom] }}
                  >
                    {faDate(month).split(" ").slice(1).join(" ")}
                  </div>
                );
              })}
            </div>
            {stages.map((stage) => {
              const deps = stage.dependsOn
                .map((id) => stages.find((item) => item.id === id)?.name)
                .filter(Boolean)
                .join("، ");
              return (
                <div key={stage.id} className="relative h-16 border-b border-line">
                  <button
                    type="button"
                    onClick={() => setDraft(stage)}
                    className={`absolute top-4 flex h-8 items-center overflow-hidden px-2 text-[11px] text-white ${BAR[stage.status]}`}
                    style={{
                      right: Math.max(0, daysFrom(rangeStart, stage.startDate)) * PX[zoom],
                      width: Math.max(PX[zoom] * 2, daysFrom(stage.startDate, stage.endDate) * PX[zoom]),
                      backgroundImage: stage.delayDays
                        ? "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,.28) 4px, rgba(255,255,255,.28) 8px)"
                        : undefined,
                    }}
                    title={deps ? `پس از ${deps}` : stage.name}
                  >
                    <span className="truncate">{faPercent(stage.progress, 0)}</span>
                  </button>
                </div>
              );
            })}
            {today && today >= rangeStart && today <= rangeEnd ? (
              <div className="absolute top-0 bottom-0 w-px bg-danger" style={{ right: daysFrom(rangeStart, today) * PX[zoom] }}>
                <span className="absolute top-1 -translate-x-1/2 bg-danger px-1 text-[10px] text-white">امروز</span>
              </div>
            ) : null}
          </div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((stage) => {
          const plan = today ? plannedProgress(stage, today) : 0;
          const deps = stage.dependsOn
            .map((id) => stages.find((item) => item.id === id)?.name)
            .filter(Boolean)
            .join("، ");
          return (
            <Panel key={stage.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold">{stage.name}</h2>
                <StatusPill status={stage.status} />
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted">{stage.description}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div>شروع: {faDate(stage.startDate)}</div>
                <div>پایان: {faDate(stage.endDate)}</div>
                <div>مدت: {faNum(daysFrom(stage.startDate, stage.endDate))} روز</div>
                <div>اولویت: {PRIORITY_LABEL[stage.priority]}</div>
                <div>پیشرفت: {faPercent(stage.progress, 0)}</div>
                <div>برنامه تا امروز: {today ? faPercent(plan, 0) : "—"}</div>
              </dl>
              {deps ? <div className="mt-2 text-[12px] text-muted">وابسته به {deps}</div> : null}
              {stage.delayDays > 0 ? <div className="mt-2 text-[12px] text-danger">{faNum(stage.delayDays)} روز تأخیر</div> : null}
            </Panel>
          );
        })}
      </div>

      <Modal open={Boolean(draft)} title={draft && stages.some((stage) => stage.id === draft.id) ? "ویرایش مرحله" : "مرحله جدید"} onClose={() => setDraft(null)} wide>
        {draft ? (
          <StageForm
            draft={draft}
            stages={stages}
            onChange={setDraft}
            onSave={() => {
              saveStage({ ...draft, progress: Math.max(0, Math.min(100, draft.progress)), delayDays: Math.max(0, draft.delayDays) });
              setDraft(null);
            }}
            onDelete={
              stages.some((stage) => stage.id === draft.id)
                ? () => {
                    deleteStage(draft.id);
                    setDraft(null);
                  }
                : undefined
            }
          />
        ) : null}
      </Modal>
    </div>
  );
}

function StageForm({
  draft,
  stages,
  onChange,
  onSave,
  onDelete,
}: {
  draft: Stage;
  stages: Stage[];
  onChange: (stage: Stage) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="نام">
        <input className={controlClass} value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
      </Field>
      <Field label="ترتیب">
        <input className={controlClass} type="number" value={draft.order} onChange={(event) => onChange({ ...draft, order: Number(event.target.value) })} />
      </Field>
      <Field label="شروع">
        <input className={controlClass} type="date" value={draft.startDate} onChange={(event) => onChange({ ...draft, startDate: event.target.value })} />
      </Field>
      <Field label="پایان" hint={faDate(draft.endDate)}>
        <input className={controlClass} type="date" value={draft.endDate} onChange={(event) => onChange({ ...draft, endDate: event.target.value })} />
      </Field>
      <Field label="پیشرفت">
        <input className={controlClass} type="number" min={0} max={100} value={draft.progress} onChange={(event) => onChange({ ...draft, progress: Number(event.target.value) })} />
      </Field>
      <Field label="تأخیر (روز)">
        <input className={controlClass} type="number" min={0} value={draft.delayDays} onChange={(event) => onChange({ ...draft, delayDays: Number(event.target.value) })} />
      </Field>
      <Field label="وضعیت">
        <select className={controlClass} value={draft.status} onChange={(event) => onChange({ ...draft, status: event.target.value as WorkStatus })}>
          {WORK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="اولویت">
        <select className={controlClass} value={draft.priority} onChange={(event) => onChange({ ...draft, priority: event.target.value as Priority })}>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="شرح">
          <textarea className={`${controlClass} h-20 py-2`} value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <div className="mb-2 text-[12px] text-muted">وابستگی</div>
        <div className="flex flex-wrap gap-2">
          {stages
            .filter((stage) => stage.id !== draft.id)
            .map((stage) => {
              const on = draft.dependsOn.includes(stage.id);
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      dependsOn: on ? draft.dependsOn.filter((id) => id !== stage.id) : [...draft.dependsOn, stage.id],
                    })
                  }
                  className={`border px-2 py-1 text-[12px] ${on ? "border-ink bg-ink text-white" : "border-line"}`}
                >
                  {stage.name}
                </button>
              );
            })}
        </div>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button onClick={onSave} disabled={!draft.name.trim() || draft.endDate < draft.startDate}>
          ذخیره
        </Button>
        {onDelete ? (
          <Button tone="danger" onClick={onDelete}>
            حذف
          </Button>
        ) : null}
      </div>
    </div>
  );
}
