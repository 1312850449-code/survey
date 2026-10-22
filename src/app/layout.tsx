import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "国核设备廉江项目质量问题反馈直通车",
  description: "质量问题快速反馈通道",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
