"use client";

import Link from "next/link";
import { CategoryChart, ProgressChart } from "@/components/charts";
import { BuildingCanvas } from "@/components/viewer/building-canvas";
import { Meter, Panel, StatusPill } from "@/components/ui";
import { faDate, faNum, faPercent, faToman } from "@/lib/format";
import { ACTIVITY_LABEL, CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/labels";
import { expensesByCategory, progressSeries, snapshot } from "@/lib/metrics";
import { useProject } from "@/lib/store";

const layers = { structure: true, walls: true, facade: true, mep: true };

export function DashboardView() {
  const { state } = useProject();
  const view = snapshot(state);
  const series = progressSeries(state.stages, state.project.startDate, "2026-11-21");
  const categories = expensesByCategory(state.expenses);
  const activities = [...state.activities].sort((a, b) => b.at - a.at).slice(0, 6);

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 p-4 lg:p-6">
        <Panel className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-6">
          <div>
            <div className="text-[11px] tracking-[0.16em] text-muted">{state.project.code}</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight lg:text-[28px]">
              {state.project.name}
              <span className="mr-2 text-base font-normal text-muted">{state.project.phase}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{state.project.description}</p>
            <div className="mt-4 text-sm">{state.project.address}</div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <Meta label="شروع" value={faDate(state.project.startDate)} />
            <Meta label="اتمام برآوردی" value={faDate(state.project.endDate)} />
            <div>
              <dt className="text-[11px] text-muted">وضعیت</dt>
              <dd className="mt-1">
                <StatusPill status={state.project.status} />
              </dd>
            </div>
            <Meta label="طبقات" value={faNum(view.floorCount)} />
            <Meta label="واحدها" value={faNum(view.unitCount)} />
            <Meta label="زیربنا" value={`${faNum(view.area)} مترمربع`} />
          </dl>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Stat label="پیشرفت پروژه" value={faPercent(view.progress)} note="میانگین وزنی مراحل" meter={view.progress} />
          <Stat label="بودجه کل" value={faToman(view.budget)} note="سقف مصوب" />
          <Stat label="هزینه انجام‌شده" value={faToman(view.spent)} note={`${faPercent((view.spent / view.budget) * 100, 0)} از بودجه`} />
          <Stat label="مانده بودجه" value={faToman(view.remaining)} note="بودجه منهای هزینه" />
          <Stat label="مراحل تکمیل‌شده" value={faNum(view.completedStages)} note={`از ${faNum(state.stages.length)} مرحله`} />
          <Stat label="در حال اجرا" value={faNum(view.activeStages)} note={view.delayedStages ? `${faNum(view.delayedStages)} مرحله با تأخیر` : "بدون تأخیر باز"} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <Panel className="relative min-h-[460px] overflow-hidden">
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
              simulation={null}
              autoRotate
              preset="iso"
              presetNonce={0}
              compact
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <div className="bg-white/85 px-3 py-2 text-[12px] text-ink">وضعیت فعلی ساخت</div>
              <Link href="/building" className="pointer-events-auto border border-ink bg-ink px-3 py-2 text-[12px] text-white">
                باز کردن مدل
              </Link>
            </div>
          </Panel>
          <Panel className="flex max-h-[520px] flex-col">
            <div className="border-b border-line px-4 py-3 text-sm font-semibold">فعالیت‌های اخیر</div>
            <div className="flex-1 overflow-auto">
              {activities.map((item) => (
                <div key={item.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-accent">{ACTIVITY_LABEL[item.kind]}</span>
                    <span className="text-[11px] text-muted">{faDate(item.date)}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium">{item.title}</div>
                  <p className="mt-1 text-[12px] leading-5 text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
          <Panel className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">روند پیشرفت</h2>
              <span className="text-[11px] text-muted">از شروع پروژه تا امروز</span>
            </div>
            <div className="h-64">
              <ProgressChart points={series} />
            </div>
          </Panel>
          <Panel className="p-4">
            <h2 className="text-sm font-semibold">ترکیب هزینه</h2>
            <CategoryChart items={categories} />
            <div className="space-y-2">
              {categories.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-[12px]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2" style={{ background: CATEGORY_COLOR[item.category] }} />
                    {CATEGORY_LABEL[item.category]}
                  </span>
                  <span>{faToman(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Meter value={(view.spent / view.budget) * 100} tone="ink" />
              <div className="mt-2 text-[11px] text-muted">پیش‌بینی اتمام {faToman(view.forecast)}</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  meter,
}: {
  label: string;
  value: string;
  note: string;
  meter?: number;
}) {
  return (
    <Panel className="p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      {meter != null ? (
        <div className="mt-3">
          <Meter value={meter} />
        </div>
      ) : null}
      <div className="mt-2 text-[11px] text-muted">{note}</div>
    </Panel>
  );
}
