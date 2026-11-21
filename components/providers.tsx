"use client";

import { ProjectProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProjectProvider>{children}</ProjectProvider>;
}
