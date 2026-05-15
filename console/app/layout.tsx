import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '해일미리 — Knox_Knox 검수 콘솔',
  description: '사내 업무 문의 자동 응답 AI Agent 검수 콘솔',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
