export function PageFallback({ label = "در حال بارگذاری…" }: { label?: string }) {
  return (
    <div className="grid h-full place-items-center text-[13px] text-muted">
      <div className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        {label}
      </div>
    </div>
  );
}
