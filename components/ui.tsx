"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { STATUS_LABEL } from "@/lib/labels";
import type { WorkStatus } from "@/lib/types";

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-line/80 bg-surface ${className}`}>{children}</section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <div className="mt-1 max-w-2xl text-[13px] leading-6 text-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  tone = "ink",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "ink" | "accent" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const tones = {
    ink: "bg-ink text-white hover:bg-black",
    accent: "bg-accent text-white hover:bg-[#a45d24]",
    ghost: "border border-line bg-surface text-ink hover:bg-canvas",
    danger: "border border-danger/25 bg-surface text-danger hover:bg-danger/5",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 px-3.5 text-[13px] font-medium transition-colors disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function ToolButton({
  children,
  onClick,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1.5 border px-2 text-[11px] transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line/90 bg-surface/95 text-ink hover:border-ink/25"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] text-muted">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-muted/80">{hint}</span> : null}
    </label>
  );
}

export const controlClass =
  "h-9 w-full border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-ink/40";

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className={`max-h-[90vh] w-full overflow-auto border border-line bg-surface ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="text-[12px] text-muted hover:text-ink">
            بستن
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

const STATUS_CLASS: Record<WorkStatus, string> = {
  not_started: "bg-[#F0EEEA] text-[#5F5A52]",
  in_progress: "bg-[#F7EDE3] text-[#8A4E1D]",
  completed: "bg-[#E8F3ED] text-[#1F6A48]",
  delayed: "bg-[#F8EAEA] text-[#A33B38]",
  on_hold: "bg-[#F8F1E3] text-[#8A6818]",
};

export function StatusPill({ status }: { status: WorkStatus }) {
  return (
    <span className={`inline-flex h-6 items-center px-2 text-[11px] font-medium tracking-wide ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Meter({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: "accent" | "ok" | "warn" | "danger" | "ink";
}) {
  const width = Math.max(0, Math.min(100, value));
  const color = {
    accent: "bg-accent",
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
    ink: "bg-ink",
  }[tone];
  return (
    <div className="h-1 w-full bg-[#EBE7E0]">
      <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-dashed border-line px-4 py-10 text-center text-[13px] text-muted">{children}</div>
  );
}
