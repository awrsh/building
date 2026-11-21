"use client";

import { useState } from "react";
import { Button, Empty, Field, Meter, Modal, PageHeader, Panel, controlClass } from "@/components/ui";
import { faDate, faNum, faPercent, faToman, todayIso, uid } from "@/lib/format";
import { isLowStock, materialCost, stockOf } from "@/lib/metrics";
import { useProject } from "@/lib/store";
import type { MaterialItem } from "@/lib/types";

function blank(): MaterialItem {
  return {
    id: uid("mat"),
    name: "",
    category: "سازه",
    unit: "عدد",
    required: 0,
    purchased: 0,
    consumed: 0,
    unitPrice: 0,
    supplier: "",
    purchaseDate: todayIso(),
  };
}

export function MaterialView({ embedded = false }: { embedded?: boolean }) {
  const { state, saveMaterial, deleteMaterial, purchaseMaterial, consumeMaterial } = useProject();
  const [draft, setDraft] = useState<MaterialItem | null>(null);
  const [movement, setMovement] = useState<{ id: string; mode: "buy" | "use" } | null>(null);
  const [qty, setQty] = useState(0);
  const [asExpense, setAsExpense] = useState(true);
  const alerts = state.materials.filter(isLowStock);

  return (
    <div className={embedded ? "space-y-4" : "h-full overflow-auto p-4 lg:p-6"}>
      <PageHeader
        title="مصالح و انبار"
        description="موجودی، خرید و مصرف. کمبود وقتی موجودی از یک‌چهارم نیاز باقی‌مانده کمتر باشد."
        actions={<Button onClick={() => setDraft(blank())}>مصالح جدید</Button>}
      />

      {alerts.length ? (
        <Panel className="mb-4 border-danger/35 bg-danger/10 p-4">
          <div className="text-sm font-semibold text-danger">هشدار کمبود</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {alerts.map((item) => (
              <span
                key={item.id}
                className="rounded-lg border border-danger/30 bg-[#0b1220] px-2.5 py-1.5 text-[12px] text-ink"
              >
                {item.name} · موجودی {faNum(stockOf(item))} {item.unit}
              </span>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel className="overflow-auto">
        {state.materials.length ? (
          <table className="w-full min-w-[920px] text-right text-sm">
            <thead className="text-[12px] text-muted">
              <tr className="border-b border-line">
                <th className="px-3 py-3 font-medium">کالا</th>
                <th className="px-3 py-3 font-medium">نیاز</th>
                <th className="px-3 py-3 font-medium">خرید</th>
                <th className="px-3 py-3 font-medium">مصرف</th>
                <th className="px-3 py-3 font-medium">موجودی</th>
                <th className="px-3 py-3 font-medium">مبلغ خرید</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {state.materials.map((item) => {
                const stock = stockOf(item);
                const coverage = item.required ? Math.min(100, (item.purchased / item.required) * 100) : 0;
                return (
                  <tr key={item.id} className="border-b border-line align-top">
                    <td className="px-3 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[12px] text-muted">
                        {item.category} · {item.supplier}
                      </div>
                      {isLowStock(item) ? <div className="mt-1 text-[11px] text-danger">کمبود موجودی</div> : null}
                    </td>
                    <td className="px-3 py-3">
                      {faNum(item.required)} {item.unit}
                    </td>
                    <td className="px-3 py-3">
                      {faNum(item.purchased)}
                      <div className="mt-2 w-24">
                        <Meter value={coverage} tone={coverage < 50 ? "warn" : "ok"} />
                      </div>
                    </td>
                    <td className="px-3 py-3">{faNum(item.consumed)}</td>
                    <td className="px-3 py-3">{faNum(stock)}</td>
                    <td className="px-3 py-3">
                      <div>{faToman(materialCost(item))}</div>
                      <div className="text-[11px] text-muted">فی {faToman(item.unitPrice, "full")}</div>
                      <div className="text-[11px] text-muted">{faDate(item.purchaseDate)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1 text-[12px]">
                        <button type="button" className="underline" onClick={() => setDraft(item)}>
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="underline"
                          onClick={() => {
                            setMovement({ id: item.id, mode: "buy" });
                            setQty(0);
                            setAsExpense(true);
                          }}
                        >
                          خرید
                        </button>
                        <button
                          type="button"
                          className="underline"
                          onClick={() => {
                            setMovement({ id: item.id, mode: "use" });
                            setQty(0);
                          }}
                        >
                          مصرف
                        </button>
                        <button type="button" className="text-danger underline" onClick={() => deleteMaterial(item.id)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <Empty>مصالحی ثبت نشده است.</Empty>
        )}
      </Panel>

      <Panel className="mt-4 p-4">
        <h2 className="text-sm font-semibold">گزارش مصرف</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {state.materials.map((item) => {
            const used = item.required ? (item.consumed / item.required) * 100 : 0;
            return (
              <div key={item.id}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span>{item.name}</span>
                  <span className="text-muted">{faPercent(used, 0)} از نیاز</span>
                </div>
                <Meter value={used} tone="ink" />
              </div>
            );
          })}
        </div>
      </Panel>

      <Modal open={Boolean(draft)} title="کالای انبار" onClose={() => setDraft(null)}>
        {draft ? (
          <div className="space-y-3">
            <Field label="نام">
              <input className={controlClass} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="دسته">
                <input className={controlClass} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
              </Field>
              <Field label="واحد">
                <input className={controlClass} value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
              </Field>
              <Field label="مقدار موردنیاز">
                <input className={controlClass} type="number" value={draft.required} onChange={(event) => setDraft({ ...draft, required: Number(event.target.value) })} />
              </Field>
              <Field label="خریداری‌شده">
                <input className={controlClass} type="number" value={draft.purchased} onChange={(event) => setDraft({ ...draft, purchased: Number(event.target.value) })} />
              </Field>
              <Field label="مصرف‌شده">
                <input className={controlClass} type="number" value={draft.consumed} onChange={(event) => setDraft({ ...draft, consumed: Number(event.target.value) })} />
              </Field>
              <Field label="قیمت واحد (تومان)" hint={faToman(draft.unitPrice)}>
                <input className={controlClass} type="number" value={draft.unitPrice} onChange={(event) => setDraft({ ...draft, unitPrice: Number(event.target.value) })} />
              </Field>
            </div>
            <Field label="تأمین‌کننده">
              <input className={controlClass} value={draft.supplier} onChange={(event) => setDraft({ ...draft, supplier: event.target.value })} />
            </Field>
            <Field label="تاریخ خرید" hint={faDate(draft.purchaseDate)}>
              <input className={controlClass} type="date" value={draft.purchaseDate} onChange={(event) => setDraft({ ...draft, purchaseDate: event.target.value })} />
            </Field>
            <div className="text-[12px] text-muted">جمع خرید {faToman(draft.purchased * draft.unitPrice)}</div>
            <Button
              disabled={!draft.name.trim()}
              onClick={() => {
                saveMaterial({ ...draft, consumed: Math.min(draft.consumed, draft.purchased) });
                setDraft(null);
              }}
            >
              ذخیره
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(movement)}
        title={movement?.mode === "buy" ? "ثبت خرید" : "ثبت مصرف"}
        onClose={() => setMovement(null)}
      >
        {movement ? (
          <div className="space-y-3">
            <Field label="مقدار">
              <input className={controlClass} type="number" min={0} value={qty || ""} onChange={(event) => setQty(Number(event.target.value))} />
            </Field>
            {movement.mode === "buy" ? (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={asExpense} onChange={(event) => setAsExpense(event.target.checked)} />
                ثبت هم‌زمان به‌عنوان هزینه مصالح
              </label>
            ) : null}
            <Button
              disabled={qty <= 0}
              onClick={() => {
                if (movement.mode === "buy") purchaseMaterial(movement.id, qty, asExpense);
                else consumeMaterial(movement.id, qty);
                setMovement(null);
              }}
            >
              ثبت
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
