import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kyokai-lab — ニューラルネット境界ラボ",
  description:
    "2 次元データに多層パーセプトロンをブラウザ内で学習させ、決定境界が変形していく過程をリアルタイム可視化する教材アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
