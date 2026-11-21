"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  ChartNoAxesGantt,
  ChevronsLeft,
  ChevronsRight,
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

const COLLAPSE_KEY = "cinnagen-sidebar-collapsed";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useProject();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [today, setToday] = useState("");
  const current = NAV.find((item) => (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setToday(faDate(iso));
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="flex h-full bg-canvas">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="بستن منو"
          className="fixed inset-0 z-30 bg-ink/35 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex shrink-0 flex-col bg-sidebar text-white transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
          collapsed ? "lg:w-[68px]" : "lg:w-[232px]"
        } w-[232px] ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex items-center border-b border-white/[0.07] ${collapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-4"}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center border border-accent/80 text-[11px] font-semibold tracking-wide text-accent">
            CG
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold tracking-tight">سیناژن</div>
              <div className="truncate text-[10px] text-white/45">مدیریت ساخت</div>
            </div>
          ) : null}
        </div>

        <nav className={`flex-1 space-y-0.5 overflow-auto py-3 ${collapsed ? "px-2" : "px-2.5"}`}>
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-sm text-[13px] transition-colors ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                } ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/55 hover:bg-white/[0.04] hover:text-white/90"
                }`}
              >
                <Icon size={16} strokeWidth={1.6} className={active ? "text-accent" : "text-white/50 group-hover:text-white/80"} />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={`border-t border-white/[0.07] ${collapsed ? "p-2" : "px-4 py-3"}`}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`no-print hidden w-full items-center gap-2 text-[11px] text-white/45 hover:text-white/80 lg:flex ${
              collapsed ? "justify-center py-2" : "justify-between py-1"
            }`}
            aria-label={collapsed ? "باز کردن سایدبار" : "بستن سایدبار"}
            title={collapsed ? "باز کردن منو" : "جمع کردن منو"}
          >
            {!collapsed ? (
              <>
                <span>جمع کردن</span>
                <ChevronsRight size={14} strokeWidth={1.75} />
              </>
            ) : (
              <ChevronsLeft size={14} strokeWidth={1.75} />
            )}
          </button>
          {!collapsed ? (
            <div className="mt-2 space-y-0.5 text-[10px] leading-4 text-white/35">
              <div className="font-mono text-[11px] text-white/55">{state.project.code}</div>
              <div>{state.project.phase}</div>
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-sm lg:px-5">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center border border-line bg-surface text-ink lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
          >
            {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
          <button
            type="button"
            className="no-print hidden h-8 w-8 place-items-center border border-line bg-surface text-muted hover:text-ink lg:grid"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "باز کردن سایدبار" : "بستن سایدبار"}
            title={collapsed ? "باز کردن منو" : "جمع کردن منو"}
          >
            {collapsed ? <ChevronsLeft size={14} /> : <ChevronsRight size={14} />}
          </button>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium tracking-tight">{current?.label ?? "مدیریت ساخت"}</div>
            <div className="truncate text-[11px] text-muted">{state.project.name}</div>
          </div>
          <div className="mr-auto flex items-center gap-2.5">
            <StatusPill status={state.project.status} />
            <span className="hidden text-[11px] text-muted sm:inline">{today}</span>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
