// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "صَرْح | SARH Cloud - بنيان أعمالك السحابي",
  description: "المنصة السحابية المتكاملة لإدارة الأنشطة والعمليات اللوجستية ونقاط البيع في مصر والخليج",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        suppressHydrationWarning
        className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-500 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}