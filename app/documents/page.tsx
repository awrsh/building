import type { Metadata } from "next";
import { DocumentsView } from "@/components/views/documents-view";

export const metadata: Metadata = {
  title: "اسناد و تصاویر",
};

export const instant = false;

export default function Page() {
  return <DocumentsView />;
}
