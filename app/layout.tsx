import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/shell";
import "./globals.css";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: {
    default: "مدیریت ساخت سیناژن",
    template: "%s · سیناژن",
  },
  description: "نمایش سه‌بعدی، شبیه‌سازی ساخت و مدیریت اجرایی ساختمان آزمایشگاه و دفاتر",
};

/** داشبورد تعاملی کلاینت‌محور؛ validation ناوبری آنی برای این اپ الزامی نیست */
export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} h-full antialiased`}>
      <body className={`${vazir.className} h-full bg-canvas text-ink`}>
        <Providers>
          <Suspense fallback={<PageFallback />}>
            <Shell>{children}</Shell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
