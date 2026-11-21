"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  ChartNoAxesGantt,
  Clapperboard,
  FileChartColumn,
  FolderOpen,
  Layers,
  LayoutDashboard,
  Menu,
  Package,
  Settings2,
  Wallet,
  X,
} from "lucide-react";
import { faDate } from "@/lib/format";
import { useProject } from "@/lib/store";
import { StatusPill } from "./ui";

const NAV = [
  { href: "/", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/building", label: "ساختمان سه‌بعدی", icon: Box },
  { href: "/simulation", label: "شبیه‌سازی ساخت", icon: Clapperboard },
  { href: "/floors", label: "طبقات", icon: Layers },
  { href: "/timeline", label: "زمان‌بندی", icon: ChartNoAxesGantt },
  { href: "/finance", label: "مدیریت مالی", icon: Wallet },
  { href: "/materials", label: "مصالح و انبار", icon: Package },
  { href: "/documents", label: "اسناد و تصاویر", icon: FolderOpen },
  { href: "/reports", label: "گزارش‌ها", icon: FileChartColumn },
  { href: "/admin", label: "پنل مدیریت", icon: Settings2 },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useProject();
  const [open, setOpen] = useState(false);
  const [today, setToday] = useState("");
  const current = NAV.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setToday(faDate(iso));
  }, []);

  return (
    <div className="flex h-full bg-canvas">
      {open ? (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-64 shrink-0 flex-col bg-[#232321] text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-accent text-sm font-semibold text-accent">
              CG
            </span>
            <div>
              <div className="text-sm font-semibold">سیناژن</div>
              <div className="text-[11px] text-white/55">مدیریت ساخت</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-auto px-3 py-4">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 border-r-2 px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "border-accent bg-white/8 text-white"
                    : "border-transparent text-white/68 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-[11px] leading-5 text-white/50">
          <div className="font-mono text-[12px] text-white/80">{state.project.code}</div>
          <div>{state.project.phase} · نسخه نمایشی</div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-canvas px-4 lg:px-6">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center border border-line bg-surface lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "بستن منو" : "باز کردن منو"}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{current?.label ?? "مدیریت ساخت"}</div>
            <div className="truncate text-[11px] text-muted">{state.project.name}</div>
          </div>
          <div className="mr-auto flex items-center gap-3">
            <StatusPill status={state.project.status} />
            <span className="hidden text-[12px] text-muted sm:inline">{today}</span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
