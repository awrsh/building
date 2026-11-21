import type {
  ActivityKind,
  DocCategory,
  ExpenseCategory,
  Priority,
  WorkStatus,
} from "./types";

export const STATUS_LABEL: Record<WorkStatus, string> = {
  not_started: "شروع‌نشده",
  in_progress: "در حال اجرا",
  completed: "تکمیل‌شده",
  delayed: "دارای تأخیر",
  on_hold: "متوقف",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  critical: "بحرانی",
};

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  materials: "خرید مصالح",
  labor: "نیروی انسانی",
  contractors: "پیمانکاران",
  equipment: "تجهیزات",
  transport: "حمل‌ونقل",
  overhead: "هزینه‌های جانبی",
};

export const CATEGORY_COLOR: Record<ExpenseCategory, string> = {
  materials: "#C87532",
  labor: "#252525",
  contractors: "#6E695F",
  equipment: "#31966B",
  transport: "#3E6E8C",
  overhead: "#E6A23C",
};

export const DOC_LABEL: Record<DocCategory, string> = {
  architecture: "نقشه معماری",
  structure: "نقشه سازه",
  mep: "نقشه تأسیسات",
  contract: "قرارداد",
  invoice: "فاکتور",
  technical: "مستند فنی",
};

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  operation: "عملیات",
  floor: "طبقه",
  cost: "هزینه",
  image: "تصویر",
  stage: "مرحله",
};

export const EXPENSE_CATEGORIES = Object.keys(CATEGORY_LABEL) as ExpenseCategory[];
export const WORK_STATUSES = Object.keys(STATUS_LABEL) as WorkStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABEL) as Priority[];
export const DOC_CATEGORIES = Object.keys(DOC_LABEL) as DocCategory[];
