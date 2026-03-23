import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ぴよログ分析 | 育児ログをAIが評価・コメント",
  description: "ぴよログのCSVをアップロードすると、AIが育児の頑張りを評価してあたたかいコメントをくれます",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 antialiased">
        {children}
      </body>
    </html>
  );
}
