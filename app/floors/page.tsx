import type { Metadata } from "next";
import { FloorView } from "@/components/views/floor-view";

export const metadata: Metadata = {
  title: "طبقات",
};

export default function Page() {
  return <FloorView />;
}
