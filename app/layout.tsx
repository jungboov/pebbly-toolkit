import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalStyles } from './themes';

// 1. 폰트 설정
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. 메타데이터 설정
export const metadata: Metadata = {
  title: "Pebbly Toolkit",
  description: "AI Background Remover & Batch Processor",
};

// 3. RootLayout 정의 (단 한 번만 정의해야 함)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ko" 
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* themes.ts에서 정의한 전역 애니메이션 스타일 주입 */}
        <style dangerouslySetInnerHTML={{ __html: GlobalStyles }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-black">
        {children}
      </body>
    </html>
  );
}