"use client";

import { useEffect, useState } from "react";
import { CategoryChart, ProgressChart } from "@/components/charts";
import { Button, Field, Meter, Panel, StatusPill, controlClass } from "@/components/ui";
import { exportWorkbook } from "@/lib/export";
import { faDate, faNum, faPercent, faToman, todayIso } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/labels";
import { expensesByCategory, isLowStock, plannedProgress, progressSeries, snapshot, stockOf } from "@/lib/metrics";
import { useProject } from "@/lib/store";

export function ReportsView() {
  const { state, addLog } = useProject();
  const view = snapshot(state);
  const series = progressSeries(state.stages, state.project.startDate, "2026-11-21");
  const categories = expensesByCategory(state.expenses);
  const delayed = state.stages.filter((stage) => stage.status === "delayed" || stage.delayDays > 0);
  const [busy, setBusy] = useState<"xlsx" | "pdf" | null>(null);
  const [today, setToday] = useState("2026-11-21");
  const [log, setLog] = useState({ weather: "آفتابی", crew: 60, summary: "", issues: "" });
  const [saved, setSaved] = useState("");

  useEffect(() => {
    setToday(todayIso());
  }, []);

  async function excel() {
    setBusy("xlsx");
    try {
      await exportWorkbook(state);
    } finally {
      setBusy(null);
    }
  }

  function pdf() {
    setBusy("pdf");
    window.print();
    setBusy(null);
  }

  const floors = [...state.floors].sort((a, b) => a.level - b.level);

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="print-root mx-auto max-w-[1200px]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">گزارش‌ها و تحلیل</h1>
            <p className="mt-1 text-sm text-muted">
              {state.project.name} · {state.project.code} · خروجی از داده‌های زنده پروژه
            </p>
          </div>
          <div className="no-print flex gap-2">
            <Button tone="ghost" onClick={() => void excel()} disabled={busy !== null}>
              {busy === "xlsx" ? "در حال ساخت…" : "خروجی Excel"}
            </Button>
            <Button onClick={pdf} disabled={busy !== null}>خروجی PDF</Button>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">پیشرفت کلی پروژه</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="پیشرفت وزنی" value={faPercent(view.progress)} />
            <Stat label="مراحل تکمیل" value={`${faNum(view.completedStages)} از ${faNum(state.stages.length)}`} />
            <Stat label="هزینه تا امروز" value={faToman(view.spent)} />
            <Stat label="انحراف پیش‌بینی" value={faToman(view.variance)} />
          </div>
          <Panel className="mt-3 p-4">
            <div className="h-56">
              <ProgressChart points={series} />
            </div>
          </Panel>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">پیشرفت طبقات</h2>
          <Panel className="overflow-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="text-[12px] text-muted">
                <tr className="border-b border-line">
                  <th className="px-3 py-2 font-medium">طبقه</th>
                  <th className="px-3 py-2 font-medium">وضعیت</th>
                  <th className="px-3 py-2 font-medium">کل</th>
                  <th className="px-3 py-2 font-medium">اسکلت</th>
                  <th className="px-3 py-2 font-medium">دیوار</th>
                  <th className="px-3 py-2 font-medium">تأسیسات</th>
                  <th className="px-3 py-2 font-medium">نازک‌کاری</th>
                </tr>
              </thead>
              <tbody>
                {floors.map((floor) => (
                  <tr key={floor.id} className="border-b border-line">
                    <td className="px-3 py-3">
                      <div className="font-medium">{floor.name}</div>
                      <div className="text-[11px] text-muted">{floor.program}</div>
                    </td>
                    <td className="px-3 py-3"><StatusPill status={floor.status} /></td>
                    <td className="px-3 py-3">{faPercent(floor.progress, 0)}</td>
                    <td className="px-3 py-3">{faPercent(floor.structure, 0)}</td>
                    <td className="px-3 py-3">{faPercent(floor.masonry, 0)}</td>
                    <td className="px-3 py-3">{faPercent(floor.mep, 0)}</td>
                    <td className="px-3 py-3">{faPercent(floor.finishing, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>

        <section className="mb-6 grid gap-4 xl:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold">گزارش مالی</h2>
            <Panel className="p-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>بودجه: {faToman(view.budget, "full")}</div>
                <div>هزینه: {faToman(view.spent, "full")}</div>
                <div>مانده: {faToman(view.remaining, "full")}</div>
                <div>پیش‌بینی اتمام: {faToman(view.forecast, "full")}</div>
              </dl>
              <CategoryChart items={categories} />
              <div className="space-y-1 text-[12px]">
                {categories.map((item) => (
                  <div key={item.category} className="flex justify-between">
                    <span>{CATEGORY_LABEL[item.category]}</span>
                    <span>{faToman(item.value)}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">مصرف مصالح</h2>
            <Panel className="space-y-3 p-4">
              {state.materials.map((item) => (
                <div key={item.id}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span>
                      {item.name}
                      {isLowStock(item) ? <span className="mr-2 text-danger">کمبود</span> : null}
                    </span>
                    <span className="text-muted">
                      موجودی {faNum(stockOf(item))} {item.unit}
                    </span>
                  </div>
                  <Meter value={item.required ? (item.consumed / item.required) * 100 : 0} tone={isLowStock(item) ? "danger" : "ink"} />
                </div>
              ))}
            </Panel>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">تأخیرها</h2>
          {delayed.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {delayed.map((stage) => (
                <Panel key={stage.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{stage.name}</div>
                    <StatusPill status={stage.status} />
                  </div>
                  <div className="mt-2 text-[12px] text-muted">
                    {faNum(stage.delayDays)} روز تأخیر · پیشرفت واقعی {faPercent(stage.progress, 0)} در برابر برنامه {faPercent(plannedProgress(stage, today), 0)}
                  </div>
                  <p className="mt-2 text-[12px] leading-5">{stage.description}</p>
                </Panel>
              ))}
            </div>
          ) : (
            <Panel className="p-4 text-sm text-muted">تأخیر باز ثبت نشده است.</Panel>
          )}
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">عملیات روزانه</h2>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Panel>
              {state.logs.map((item) => (
                <div key={item.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex justify-between text-[12px] text-muted">
                    <span>{faDate(item.date)}</span>
                    <span>{item.weather} · {faNum(item.crew)} نفر</span>
                  </div>
                  <p className="mt-1 text-sm">{item.summary}</p>
                  {item.issues ? <p className="mt-1 text-[12px] text-danger">{item.issues}</p> : null}
                </div>
              ))}
            </Panel>
            <Panel className="no-print space-y-3 p-4">
              <div className="text-sm font-medium">ثبت گزارش روزانه</div>
              <Field label="هوا">
                <input className={controlClass} value={log.weather} onChange={(event) => setLog({ ...log, weather: event.target.value })} />
              </Field>
              <Field label="نفرات حاضر">
                <input className={controlClass} type="number" value={log.crew} onChange={(event) => setLog({ ...log, crew: Number(event.target.value) })} />
              </Field>
              <Field label="شرح عملیات">
                <textarea className={`${controlClass} h-20 py-2`} value={log.summary} onChange={(event) => setLog({ ...log, summary: event.target.value })} />
              </Field>
              <Field label="موانع">
                <input className={controlClass} value={log.issues} onChange={(event) => setLog({ ...log, issues: event.target.value })} />
              </Field>
              <Button
                disabled={!log.summary.trim()}
                onClick={() => {
                  addLog({ date: todayIso(), ...log, summary: log.summary.trim() });
                  setLog({ weather: log.weather, crew: log.crew, summary: "", issues: "" });
                  setSaved("گزارش ثبت شد.");
                }}
              >
                ثبت
              </Button>
              {saved ? <p className="text-[12px] text-ok">{saved}</p> : null}
            </Panel>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Panel className="p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </Panel>
  );
}
