export function PageFallback({ label = "در حال بارگذاری…" }: { label?: string }) {
  return (
    <div className="grid h-full place-items-center text-sm text-muted">{label}</div>
  );
}
