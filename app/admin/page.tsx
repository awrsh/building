import type { Metadata } from "next";
import { AdminView } from "@/components/views/admin-view";

export const metadata: Metadata = {
  title: "پنل مدیریت",
};

export default function Page() {
  return <AdminView />;
}
