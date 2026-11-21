import type { Metadata } from "next";
import { TimelineView } from "@/components/views/timeline-view";

export const metadata: Metadata = {
  title: "زمان‌بندی",
};

export const instant = false;

export default function Page() {
  return <TimelineView />;
}
