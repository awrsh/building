"use client";

import { useMemo, useState } from "react";
import { CategoryChart, MonthlyCostChart } from "@/components/charts";
import { Button, Empty, Field, Modal, Panel, controlClass } from "@/components/ui";
import { faDate, faNum, faPercent, faToman, uid } from "@/lib/format";
import { CATEGORY_COLOR, CATEGORY_LABEL, EXPENSE_CATEGORIES } from "@/lib/labels";
import { expensesByCategory, expensesByMonth, snapshot } from "@/lib/metrics";
import { useProject } from "@/lib/store";
import type { Expense, ExpenseCategory } from "@/lib/types";

function blankExpense(): Expense {
  return {
    id: uid("exp"),
    title: "",
    category: "materials",
    amount: 0,
    date: "2026-11-21",
    floorId: null,
    stageId: null,
    vendor: "",
    note: "",
  };
}

export function FinanceView({ embedded = false }: { embedded?: boolean }) {
  const { state, saveExpense, deleteExpense } = useProject();
  const view = snapshot(state);
  const [category, setCategory] = useState<ExpenseCategory | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [floorId, setFloorId] = useState("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Expense | null>(null);

  const rows = useMemo(() => {
    return state.expenses
      .filter((expense) => (category === "all" ? true : expense.category === category))
      .filter((expense) => (floorId === "all" ? true : expense.floorId === floorId))
      .filter((expense) => (from ? expense.date >= from : true))
      .filter((expense) => (to ? expense.date <= to : true))
      .filter((expense) => expense.title.includes(query) || expense.vendor.includes(query))
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.expenses, category, floorId, from, to, query]);

  const filteredTotal = rows.reduce((sum, expense) => sum + expense.amount, 0);
  const categories = expensesByCategory(state.expenses);
  const months = expensesByMonth(state.expenses);

  return (
    <div className={embedded ? "space-y-4" : "h-full overflow-auto p-4 lg:p-6"}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">مدیریت مالی</h1>
          <p className="mt-1 text-sm text-muted">مبالغ به تومان و متصل به طبقه یا مرحله ساخت.</p>
        </div>
        <Button onClick={() => setDraft(blankExpense())}>ثبت هزینه</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Money label="بودجه کل" value={faToman(view.budget)} />
        <Money label="هزینه انجام‌شده" value={faToman(view.spent)} />
        <Money label="مانده" value={faToman(view.remaining)} />
        <Money label="پیش‌بینی اتمام" value={faToman(view.forecast)} />
        <Money
          label="انحراف پیش‌بینی"
          value={faToman(view.variance)}
          note={view.variance > 0 ? "بالاتر از بودجه" : "در محدوده بودجه"}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel className="p-4">
          <h2 className="text-sm font-semibold">دسته‌بندی</h2>
          <CategoryChart items={categories} />
          <div className="space-y-2">
            {categories.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2" style={{ background: CATEGORY_COLOR[item.category] }} />
                  {CATEGORY_LABEL[item.category]}
                </span>
                <span>
                  {faToman(item.value)} · {faPercent(view.spent ? (item.value / view.spent) * 100 : 0, 0)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-2 text-sm font-semibold">هزینه ماهانه</h2>
          <p className="mb-2 text-[11px] text-muted">محور عمودی به میلیارد تومان</p>
          <MonthlyCostChart items={months} />
        </Panel>
      </div>

      <Panel className="mt-4 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input className={controlClass} placeholder="جستجو" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className={controlClass} value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory | "all")}>
            <option value="all">همه دسته‌ها</option>
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABEL[item]}
              </option>
            ))}
          </select>
          <select className={controlClass} value={floorId} onChange={(event) => setFloorId(event.target.value)}>
            <option value="all">همه طبقات</option>
            {state.floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name}
              </option>
            ))}
          </select>
          <input className={controlClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input className={controlClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="mt-3 text-[12px] text-muted">
          {faNum(rows.length)} ردیف · جمع فیلتر {faToman(filteredTotal)}
        </div>
        <div className="mt-3 overflow-auto">
          {rows.length ? (
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="text-[12px] text-muted">
                <tr className="border-b border-line">
                  <th className="px-2 py-2 font-medium">عنوان</th>
                  <th className="px-2 py-2 font-medium">دسته</th>
                  <th className="px-2 py-2 font-medium">مبلغ</th>
                  <th className="px-2 py-2 font-medium">تاریخ</th>
                  <th className="px-2 py-2 font-medium">اتصال</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((expense) => (
                  <tr key={expense.id} className="border-b border-line">
                    <td className="px-2 py-3">
                      <div className="font-medium">{expense.title}</div>
                      <div className="text-[12px] text-muted">{expense.vendor}</div>
                    </td>
                    <td className="px-2 py-3">{CATEGORY_LABEL[expense.category]}</td>
                    <td className="px-2 py-3">{faToman(expense.amount, "full")}</td>
                    <td className="px-2 py-3">{faDate(expense.date)}</td>
                    <td className="px-2 py-3 text-[12px] text-muted">
                      {state.floors.find((floor) => floor.id === expense.floorId)?.name ?? "کل پروژه"}
                      {" · "}
                      {state.stages.find((stage) => stage.id === expense.stageId)?.name ?? "بدون مرحله"}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="text-[12px] text-ink underline" onClick={() => setDraft(expense)}>
                          ویرایش
                        </button>
                        <button type="button" className="text-[12px] text-danger underline" onClick={() => deleteExpense(expense.id)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>هزینه‌ای با این فیلتر پیدا نشد.</Empty>
          )}
        </div>
      </Panel>

      <Modal open={Boolean(draft)} title="هزینه" onClose={() => setDraft(null)}>
        {draft ? (
          <ExpenseForm
            draft={draft}
            floors={state.floors.map((floor) => ({ id: floor.id, name: floor.name }))}
            stages={state.stages.map((stage) => ({ id: stage.id, name: stage.name }))}
            onChange={setDraft}
            onSave={() => {
              if (!draft.title.trim() || draft.amount <= 0) return;
              saveExpense(draft);
              setDraft(null);
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function Money({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Panel className="p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
      {note ? <div className="mt-1 text-[11px] text-muted">{note}</div> : null}
    </Panel>
  );
}

function ExpenseForm({
  draft,
  floors,
  stages,
  onChange,
  onSave,
}: {
  draft: Expense;
  floors: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  onChange: (expense: Expense) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="عنوان">
        <input className={controlClass} value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
      </Field>
      <Field label="دسته">
        <select className={controlClass} value={draft.category} onChange={(event) => onChange({ ...draft, category: event.target.value as ExpenseCategory })}>
          {EXPENSE_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {CATEGORY_LABEL[item]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="مبلغ (تومان)" hint={draft.amount ? faToman(draft.amount) : undefined}>
        <input className={controlClass} type="number" min={0} value={draft.amount || ""} onChange={(event) => onChange({ ...draft, amount: Number(event.target.value) })} />
      </Field>
      <Field label="تاریخ" hint={faDate(draft.date)}>
        <input className={controlClass} type="date" value={draft.date} onChange={(event) => onChange({ ...draft, date: event.target.value })} />
      </Field>
      <Field label="فروشنده / پیمانکار">
        <input className={controlClass} value={draft.vendor} onChange={(event) => onChange({ ...draft, vendor: event.target.value })} />
      </Field>
      <Field label="طبقه">
        <select className={controlClass} value={draft.floorId ?? ""} onChange={(event) => onChange({ ...draft, floorId: event.target.value || null })}>
          <option value="">کل پروژه</option>
          {floors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="مرحله ساخت">
        <select className={controlClass} value={draft.stageId ?? ""} onChange={(event) => onChange({ ...draft, stageId: event.target.value || null })}>
          <option value="">بدون مرحله</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="توضیح">
        <textarea className={`${controlClass} h-20 py-2`} value={draft.note} onChange={(event) => onChange({ ...draft, note: event.target.value })} />
      </Field>
      <Button onClick={onSave} disabled={!draft.title.trim() || draft.amount <= 0}>
        ذخیره
      </Button>
    </div>
  );
}
