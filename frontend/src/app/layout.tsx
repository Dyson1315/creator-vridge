import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CreatorVridge - VTuber×絵師マッチングプラットフォーム",
  description: "VTuberとマッチングする特化型プラットフォーム。安全で信頼性の高い環境での創造的コラボレーションを実現します。",
  keywords: "VTuber, 絵師, マッチング, イラスト, キャラクターデザイン, コミッション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased bg-calm-50 min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
