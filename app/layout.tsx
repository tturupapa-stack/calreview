import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Cally - 체험단 통합 검색",
  description: "여러 체험단 사이트를 한 곳에서 검색하고, 당첨 시 구글 캘린더에 자동으로 일정을 등록해주는 Cally 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased font-sans bg-background text-foreground`}
      >
        <AnalyticsProvider />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
