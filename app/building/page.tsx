import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { BuildingView } from "@/components/views/building-view";

export const metadata: Metadata = {
  title: "ساختمان سه‌بعدی",
};

export default function Page() {
  return (
    <Suspense fallback={<PageFallback label="در حال بارگذاری مدل…" />}>
      <BuildingView />
    </Suspense>
  );
}
