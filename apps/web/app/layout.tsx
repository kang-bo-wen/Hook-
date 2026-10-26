import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hook 内测版',
  description: '一对一内容驱动的交友恋爱平台',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body><div className="site">{children}</div></body>
    </html>
  );
}
