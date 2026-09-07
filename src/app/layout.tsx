// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'صَرْح | المنظومة السحابية الموحدة',
  description: 'إدارة نقاط البيع السريعة، شبكات التجزئة والملابس، والتوافق الضريبي',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
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