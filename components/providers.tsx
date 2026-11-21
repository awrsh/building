"use client";

import { PageFallback } from "@/components/page-fallback";
import { ProjectProvider, useProject } from "@/lib/store";

/** تا آماده‌شدن localStorage فقط fallback یکسان SSR/کلاینت نشان داده می‌شود تا hydration mismatch نیاید */
function ReadyGate({ children }: { children: React.ReactNode }) {
  const { ready } = useProject();
  if (!ready) return <PageFallback label="در حال آماده‌سازی داده‌های پروژه…" />;
  return children;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <ReadyGate>{children}</ReadyGate>
    </ProjectProvider>
  );
}
