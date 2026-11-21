"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
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
  Search,
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
  const [clock, setClock] = useState("");
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
    const tick = () => {
      const now = new Date();
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setToday(faDate(iso));
      setClock(
        now.toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
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

  const onTrack = state.project.status === "in_progress" || state.project.status === "completed";

  return (
    <div className="flex h-full flex-col bg-canvas">
      <header className="no-print relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-[#0a101c]/90 px-3 backdrop-blur-md lg:px-5">
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-white/5 text-ink lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
        >
          {mobileOpen ? <X size={15} /> : <Menu size={15} />}
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/50 bg-accent/10 text-[11px] font-bold tracking-wide text-accent shadow-[0_0_16px_rgba(34,211,238,0.25)]">
            CG
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold tracking-wide">
              سیناژن <span className="text-accent">Digital Twin</span>
            </div>
            <div className="truncate text-[10px] text-muted">
              {current?.label ?? "نمای کلی"} · پروژه: {state.project.name}
            </div>
          </div>
        </div>

        <div className="mx-auto hidden items-center gap-2 rounded-full border border-ok/25 bg-ok/10 px-3 py-1 text-[11px] text-ok md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />
          وضعیت سایت: {onTrack ? "در مسیر" : "نیاز به توجه"}
        </div>

        <div className="mr-auto flex items-center gap-2 sm:gap-3">
          <StatusPill status={state.project.status} />
          <span className="hidden text-[11px] text-muted lg:inline">{clock || today}</span>
          <button type="button" className="hidden h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-accent sm:grid" aria-label="جستجو">
            <Search size={14} />
          </button>
          <button type="button" className="relative hidden h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-accent sm:grid" aria-label="اعلان‌ها">
            <Bell size={14} />
            <span className="absolute top-1.5 left-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white/5 py-1 pr-1 pl-2.5 sm:flex">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent/20 text-[10px] font-semibold text-accent">CG</span>
            <span className="text-[11px] text-ink/90">ناظر پروژه</span>
          </div>
          <button
            type="button"
            className="no-print hidden h-8 w-8 place-items-center rounded-lg border border-line text-muted hover:text-accent lg:grid"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "باز کردن سایدبار" : "بستن سایدبار"}
          >
            {collapsed ? <ChevronsLeft size={14} /> : <ChevronsRight size={14} />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="بستن منو"
            className="fixed inset-0 z-30 bg-black/55 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 right-0 z-40 mt-0 flex shrink-0 flex-col border-l border-line bg-sidebar/95 backdrop-blur-md transition-[width,transform] duration-200 lg:static lg:translate-x-0 ${
            collapsed ? "lg:w-[72px]" : "lg:w-[220px]"
          } w-[220px] ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
        >
          <nav className={`flex-1 space-y-1 overflow-auto py-4 ${collapsed ? "px-2" : "px-2.5"}`}>
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center gap-3 rounded-xl text-[13px] transition-colors ${
                    collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                  } ${
                    active
                      ? "border border-accent/30 bg-accent/10 text-accent shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                      : "border border-transparent text-muted hover:border-line hover:bg-white/4 hover:text-ink"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.6} />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className={`border-t border-line ${collapsed ? "p-2" : "px-3 py-3"}`}>
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`no-print hidden w-full items-center gap-2 rounded-lg text-[11px] text-muted hover:text-accent lg:flex ${
                collapsed ? "justify-center py-2" : "justify-between px-2 py-1.5"
              }`}
              aria-label={collapsed ? "باز کردن سایدبار" : "بستن سایدبار"}
            >
              {!collapsed ? (
                <>
                  <span>جمع کردن منو</span>
                  <ChevronsRight size={14} strokeWidth={1.75} />
                </>
              ) : (
                <ChevronsLeft size={14} strokeWidth={1.75} />
              )}
            </button>
            {!collapsed ? (
              <div className="mt-2 space-y-0.5 px-2 text-[10px] leading-4 text-muted/70">
                <div className="font-mono text-[11px] text-accent/80">{state.project.code}</div>
                <div>{state.project.phase} · Digital Twin</div>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
