import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GPT-Image Studio",
  description:
    "GPT-Image-2 Web Studio · 文生图 / 图像编辑 / 角色一致性 / 三视图 / 12 宫格 / 分镜",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({ children }: { children: JSX.Element | JSX.Element[] | null }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
