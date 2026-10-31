import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hook · 一对一真实连接',
  description: '从一段内容开始，遇见真正适合回应的人。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><div className="site">{children}</div></body>
    </html>
  );
}
