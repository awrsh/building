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
  return <section className={`glass ${className}`}>{children}</section>;
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
    ink: "bg-ink/10 text-ink border border-line hover:border-accent/40 hover:text-accent",
    accent: "bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25 shadow-[0_0_16px_rgba(34,211,238,0.15)]",
    ghost: "border border-line bg-transparent text-muted hover:text-ink hover:border-accent/30",
    danger: "border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-[13px] font-medium transition-colors disabled:opacity-40 ${tones[tone]}`}
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
      className={`inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] transition-colors ${
        active
          ? "border-accent/50 bg-accent/15 text-accent shadow-[0_0_12px_rgba(34,211,238,0.2)]"
          : "border-line bg-surface/80 text-muted hover:border-accent/30 hover:text-ink"
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
  "h-9 w-full rounded-lg border border-line bg-[#0b1220] px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-accent/50";

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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className={`glass max-h-[90vh] w-full overflow-auto ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="text-[12px] text-muted hover:text-accent">
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
  not_started: "bg-white/5 text-muted border border-line",
  in_progress: "bg-accent/10 text-accent border border-accent/25",
  completed: "bg-ok/10 text-ok border border-ok/25",
  delayed: "bg-danger/10 text-danger border border-danger/25",
  on_hold: "bg-warn/10 text-warn border border-warn/25",
};

export function StatusPill({ status }: { status: WorkStatus }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium tracking-wide ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Meter({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: "accent" | "ok" | "warn" | "danger" | "ink" | "gradient";
}) {
  const width = Math.max(0, Math.min(100, value));
  const color = {
    accent: "bg-accent",
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
    ink: "bg-ink/70",
    gradient: "meter-gradient",
  }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[13px] text-muted">{children}</div>
  );
}

/** Active/inactive segment for filters & tabs on dark glass UI */
export function SegButton({
  children,
  active,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg border px-3 text-[13px] transition-colors ${
        active
          ? "border-accent/50 bg-accent/15 text-accent shadow-[0_0_12px_rgba(34,211,238,0.15)]"
          : "border-line bg-white/5 text-muted hover:border-accent/30 hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export const rowActive = "bg-accent/10 border-accent/20";
export const rowHover = "hover:bg-white/4";
