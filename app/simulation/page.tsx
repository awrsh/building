import type { Metadata } from "next";
import { SimulationView } from "@/components/views/simulation-view";

export const metadata: Metadata = {
  title: "شبیه‌سازی ساخت",
};

export const instant = false;

export default function Page() {
  return <SimulationView />;
}
