import { toJalaali } from "jalaali-js";

const FA = "۰۱۲۳۴۵۶۷۸۹";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

export function faDigits(value: string) {
  return value.replace(/\d/g, (d) => FA[Number(d)] ?? d);
}

export function faNum(value: number, digits = 0) {
  if (!Number.isFinite(value)) return "—";
  const sign = value < 0 ? "−" : "";
  const fixed = Math.abs(value).toFixed(digits);
  const [intRaw, frac] = fixed.split(".");
  /** جداکنندهٔ سه‌رقمی با نقطه: ۱۲۳.۴۵۶.۷۸۹ */
  const int = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const body = frac ? `${int}٫${frac}` : int;
  return sign + faDigits(body);
}

export function faPercent(value: number, digits = 1) {
  return `${faNum(value, digits)}٪`;
}

export function faToman(value: number, mode: "full" | "compact" = "full") {
  const sign = value < 0 ? "−" : "";
  const n = Math.abs(value);
  if (mode === "full" || n < 1_000_000) {
    return `${sign}${faNum(Math.round(n))} تومان`;
  }
  if (n >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    const digits = v >= 100 ? 0 : 1;
    return `${sign}${faNum(v, digits)} میلیارد تومان`;
  }
  return `${sign}${faNum(n / 1_000_000, n >= 10_000_000 ? 0 : 1)} میلیون تومان`;
}

export function faDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  const j = toJalaali(y, m, d);
  return `${faNum(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${faNum(j.jy)}`;
}

export function faMonth(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  const j = toJalaali(y, m, d);
  return `${JALALI_MONTHS[j.jm - 1]} ${faNum(j.jy)}`;
}

export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function uid(prefix: string) {
  const rand = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${rand.slice(0, 8)}`;
}
