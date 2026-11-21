"use client";

import { useState } from "react";
import { DocumentsView } from "@/components/views/documents-view";
import { FinanceView } from "@/components/views/finance-view";
import { FloorView } from "@/components/views/floor-view";
import { MaterialView } from "@/components/views/material-view";
import { TimelineView } from "@/components/views/timeline-view";
import { Button, Field, Panel, controlClass } from "@/components/ui";
import { cloneSeed } from "@/lib/data";
import { faDate, faToman } from "@/lib/format";
import { STATUS_LABEL, WORK_STATUSES } from "@/lib/labels";
import { useProject } from "@/lib/store";
import type { ProjectInfo, WorkStatus } from "@/lib/types";

const TABS = [
  { id: "project", label: "مشخصات ساختمان" },
  { id: "floors", label: "طبقات" },
  { id: "stages", label: "مراحل ساخت" },
  { id: "finance", label: "هزینه‌ها" },
  { id: "materials", label: "مصالح" },
  { id: "docs", label: "اسناد و تصاویر" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function AdminView() {
  const { state, updateProject, reset } = useProject();
  const [tab, setTab] = useState<Tab>("project");
  const [draft, setDraft] = useState<ProjectInfo>(state.project);
  const [note, setNote] = useState("");

  return (
    <div className="h-full overflow-auto p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">پنل مدیریت</h1>
        <p className="mt-1 text-sm text-muted">تغییرات همین‌جا در مدل سه‌بعدی، داشبورد، مالی و گزارش‌ها دیده می‌شود.</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setTab(item.id);
              if (item.id === "project") setDraft(state.project);
            }}
            className={`h-9 border px-3 text-sm ${tab === item.id ? "border-ink bg-ink text-white" : "border-line bg-surface"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "project" ? (
        <Panel className="max-w-3xl space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نام پروژه">
              <input className={controlClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="فاز">
              <input className={controlClass} value={draft.phase} onChange={(event) => setDraft({ ...draft, phase: event.target.value })} />
            </Field>
            <Field label="کد">
              <input className={controlClass} value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
            </Field>
            <Field label="وضعیت">
              <select className={controlClass} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as WorkStatus })}>
                {WORK_STATUSES.map((status) => (
                  <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="آدرس">
                <input className={controlClass} value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} />
              </Field>
            </div>
            <Field label="کارفرما">
              <input className={controlClass} value={draft.client} onChange={(event) => setDraft({ ...draft, client: event.target.value })} />
            </Field>
            <Field label="پیمانکار">
              <input className={controlClass} value={draft.contractor} onChange={(event) => setDraft({ ...draft, contractor: event.target.value })} />
            </Field>
            <Field label="مشاور">
              <input className={controlClass} value={draft.consultant} onChange={(event) => setDraft({ ...draft, consultant: event.target.value })} />
            </Field>
            <Field label="بودجه (تومان)" hint={faToman(draft.budget)}>
              <input className={controlClass} type="number" value={draft.budget} onChange={(event) => setDraft({ ...draft, budget: Number(event.target.value) })} />
            </Field>
            <Field label="شروع" hint={faDate(draft.startDate)}>
              <input className={controlClass} type="date" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
            </Field>
            <Field label="اتمام برآوردی" hint={faDate(draft.endDate)}>
              <input className={controlClass} type="date" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="شرح">
                <textarea className={`${controlClass} h-24 py-2`} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                updateProject(draft);
                setNote("مشخصات پروژه ذخیره شد.");
              }}
            >
              ذخیره مشخصات
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                reset();
                setDraft(cloneSeed().project);
                setNote("داده‌های نمایشی بازنشانی شد.");
              }}
            >
              بازنشانی دمو
            </Button>
          </div>
          {note ? <p className="text-[12px] text-ok">{note}</p> : null}
        </Panel>
      ) : null}

      {tab === "floors" ? <FloorView embedded /> : null}
      {tab === "stages" ? <TimelineView embedded /> : null}
      {tab === "finance" ? <FinanceView embedded /> : null}
      {tab === "materials" ? <MaterialView embedded /> : null}
      {tab === "docs" ? <DocumentsView embedded /> : null}
    </div>
  );
}
