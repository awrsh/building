import type { Metadata } from "next";
import { FinanceView } from "@/components/views/finance-view";

export const metadata: Metadata = {
  title: "مدیریت مالی",
};

export default function Page() {
  return <FinanceView />;
}
