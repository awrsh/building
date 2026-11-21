import type { Metadata } from "next";
import { DashboardView } from "@/components/views/dashboard-view";

export const metadata: Metadata = {
  title: "نمای کلی",
};

export default function Page() {
  return <DashboardView />;
}
