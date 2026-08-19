import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "600", "700", "800", "900"], variable: "--font-cairo" });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["300", "400", "500", "700"], variable: "--font-tajawal" });

export const metadata: Metadata = {
  title: "لوحة توقع مغادرة العملاء — LTT",
  description: "لوحة تحكم تجريبية لتوقع احتمالية مغادرة عملاء LTT ومساعدة فرق خدمة العملاء والمبيعات على اتخاذ إجراءات استباقية.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body>{children}</body>
    </html>
  );
}
