import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 禁止页面级缩放:画布自己处理双指捏合,也防止 iOS 聚焦输入框时自动放大页面
  maximumScale: 1,
  userScalable: false,
  // 安卓键盘弹出时压缩布局而不是盖住内容
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Z-Board - 在线白板",
  description: "一个类似 Seevo 的在线白板应用，支持画笔、形状、文字、便签等多种工具",
  keywords: ["whiteboard", "online whiteboard", "collaborative", "drawing", "canvas"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
