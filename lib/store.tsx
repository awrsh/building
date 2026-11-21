"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { cloneSeed } from "./data";
import { todayIso, uid } from "./format";
import type {
  Activity,
  ActivityKind,
  DailyLog,
  DocItem,
  Expense,
  Floor,
  GalleryItem,
  MaterialItem,
  ProjectInfo,
  ProjectState,
  Stage,
} from "./types";

const KEY = "cinnagen-smart-construction-v1";

interface StoreApi {
  ready: boolean;
  state: ProjectState;
  updateProject: (patch: Partial<ProjectInfo>) => void;
  saveFloor: (floor: Floor) => void;
  deleteFloor: (id: string) => void;
  saveStage: (stage: Stage) => void;
  deleteStage: (id: string) => void;
  saveExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  saveMaterial: (item: MaterialItem) => void;
  deleteMaterial: (id: string) => void;
  purchaseMaterial: (id: string, qty: number, asExpense: boolean) => void;
  consumeMaterial: (id: string, qty: number) => void;
  addGallery: (item: GalleryItem) => void;
  deleteGallery: (id: string) => void;
  addDocument: (item: DocItem) => void;
  deleteDocument: (id: string) => void;
  addLog: (log: Omit<DailyLog, "id"> & { id?: string }) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function activity(kind: ActivityKind, title: string, detail: string): Activity {
  return { id: uid("act"), kind, title, detail, date: todayIso(), at: Date.now() };
}

function withActivity(state: ProjectState, item: Activity): ProjectState {
  return { ...state, activities: [item, ...state.activities].slice(0, 40) };
}

function loadState(): ProjectState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return cloneSeed();
    const parsed = JSON.parse(raw) as { version?: number; state?: ProjectState };
    if (parsed.version !== 1 || !parsed.state?.project || !parsed.state.floors) return cloneSeed();
    return parsed.state;
  } catch {
    return cloneSeed();
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectState>(cloneSeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ version: 1, state }));
  }, [ready, state]);

  const api = useMemo<StoreApi>(() => {
    return {
      ready,
      state,
      updateProject: (patch) => {
        setState((current) =>
          withActivity(
            { ...current, project: { ...current.project, ...patch } },
            activity("operation", "ویرایش مشخصات پروژه", "اطلاعات شناسنامه ساختمان به‌روزرسانی شد."),
          ),
        );
      },
      saveFloor: (floor) => {
        setState((current) => {
          const exists = current.floors.some((item) => item.id === floor.id);
          const floors = exists
            ? current.floors.map((item) => (item.id === floor.id ? floor : item))
            : [...current.floors, floor];
          return withActivity(
            { ...current, floors },
            activity("floor", exists ? `ویرایش ${floor.name}` : `افزودن ${floor.name}`, floor.program || "اطلاعات طبقه ثبت شد."),
          );
        });
      },
      deleteFloor: (id) => {
        setState((current) => {
          const floor = current.floors.find((item) => item.id === id);
          return withActivity(
            {
              ...current,
              floors: current.floors.filter((item) => item.id !== id),
              expenses: current.expenses.map((item) => (item.floorId === id ? { ...item, floorId: null } : item)),
            },
            activity("floor", "حذف طبقه", floor ? floor.name : "یک طبقه حذف شد."),
          );
        });
      },
      saveStage: (stage) => {
        setState((current) => {
          const exists = current.stages.some((item) => item.id === stage.id);
          const stages = exists
            ? current.stages.map((item) => (item.id === stage.id ? stage : item))
            : [...current.stages, stage];
          return withActivity(
            { ...current, stages },
            activity("stage", exists ? `ویرایش ${stage.name}` : `تعریف ${stage.name}`, `وضعیت: ${stage.status}`),
          );
        });
      },
      deleteStage: (id) => {
        setState((current) => {
          const stage = current.stages.find((item) => item.id === id);
          return withActivity(
            {
              ...current,
              stages: current.stages
                .filter((item) => item.id !== id)
                .map((item) => ({ ...item, dependsOn: item.dependsOn.filter((dep) => dep !== id) })),
            },
            activity("stage", "حذف مرحله", stage ? stage.name : "یک مرحله حذف شد."),
          );
        });
      },
      saveExpense: (expense) => {
        setState((current) => {
          const exists = current.expenses.some((item) => item.id === expense.id);
          const expenses = exists
            ? current.expenses.map((item) => (item.id === expense.id ? expense : item))
            : [expense, ...current.expenses];
          return withActivity(
            { ...current, expenses },
            activity("cost", exists ? "ویرایش هزینه" : "ثبت هزینه", expense.title),
          );
        });
      },
      deleteExpense: (id) => {
        setState((current) => {
          const expense = current.expenses.find((item) => item.id === id);
          return withActivity(
            { ...current, expenses: current.expenses.filter((item) => item.id !== id) },
            activity("cost", "حذف هزینه", expense ? expense.title : "یک هزینه حذف شد."),
          );
        });
      },
      saveMaterial: (item) => {
        setState((current) => {
          const exists = current.materials.some((row) => row.id === item.id);
          const materials = exists
            ? current.materials.map((row) => (row.id === item.id ? item : row))
            : [item, ...current.materials];
          return withActivity(
            { ...current, materials },
            activity("operation", exists ? "ویرایش مصالح" : "ثبت مصالح", item.name),
          );
        });
      },
      deleteMaterial: (id) => {
        setState((current) => {
          const item = current.materials.find((row) => row.id === id);
          return withActivity(
            { ...current, materials: current.materials.filter((row) => row.id !== id) },
            activity("operation", "حذف مصالح", item ? item.name : "یک کالا حذف شد."),
          );
        });
      },
      purchaseMaterial: (id, qty, asExpense) => {
        setState((current) => {
          const item = current.materials.find((row) => row.id === id);
          if (!item || qty <= 0) return current;
          const materials = current.materials.map((row) =>
            row.id === id ? { ...row, purchased: row.purchased + qty, purchaseDate: todayIso() } : row,
          );
          let expenses = current.expenses;
          if (asExpense) {
            expenses = [
              {
                id: uid("exp"),
                title: `خرید ${item.name}`,
                category: "materials",
                amount: qty * item.unitPrice,
                date: todayIso(),
                floorId: null,
                stageId: null,
                vendor: item.supplier,
                note: "ثبت‌شده از انبار",
              },
              ...expenses,
            ];
          }
          return withActivity(
            { ...current, materials, expenses },
            activity("operation", `خرید ${item.name}`, `${qty} ${item.unit} به موجودی اضافه شد.`),
          );
        });
      },
      consumeMaterial: (id, qty) => {
        setState((current) => {
          const item = current.materials.find((row) => row.id === id);
          if (!item || qty <= 0) return current;
          const next = Math.min(item.purchased, item.consumed + qty);
          const materials = current.materials.map((row) => (row.id === id ? { ...row, consumed: next } : row));
          return withActivity(
            { ...current, materials },
            activity("operation", `مصرف ${item.name}`, `${qty} ${item.unit} از انبار خارج شد.`),
          );
        });
      },
      addGallery: (item) => {
        setState((current) =>
          withActivity(
            { ...current, gallery: [item, ...current.gallery] },
            activity("image", "بارگذاری تصویر", item.title),
          ),
        );
      },
      deleteGallery: (id) => {
        setState((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== id) }));
      },
      addDocument: (item) => {
        setState((current) =>
          withActivity(
            { ...current, documents: [item, ...current.documents] },
            activity("operation", "ثبت سند", item.title),
          ),
        );
      },
      deleteDocument: (id) => {
        setState((current) => ({ ...current, documents: current.documents.filter((item) => item.id !== id) }));
      },
      addLog: (log) => {
        setState((current) => {
          const entry: DailyLog = { ...log, id: log.id ?? uid("log") };
          return withActivity(
            { ...current, logs: [entry, ...current.logs] },
            activity("operation", "ثبت گزارش روزانه", entry.summary),
          );
        });
      },
      reset: () => setState(cloneSeed()),
    };
  }, [ready, state]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useProject() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useProject must be used within ProjectProvider");
  return store;
}
