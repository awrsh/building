import type { Metadata } from "next";
import { DocumentsView } from "@/components/views/documents-view";

export const metadata: Metadata = {
  title: "اسناد و تصاویر",
};

export default function Page() {
  return <DocumentsView />;
}
