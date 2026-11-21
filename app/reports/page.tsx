import type { Metadata } from "next";
import { ReportsView } from "@/components/views/reports-view";

export const metadata: Metadata = {
  title: "گزارش‌ها",
};

export const instant = false;

export default function Page() {
  return <ReportsView />;
}
