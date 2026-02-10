import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/layout/site-header';

export const metadata: Metadata = {
  title: '부동산 정보 - 경매·분양·청약',
  description: '부동산 경매 통계, 법원 경매 물건, LH 분양·임대, 청약홈 분양정보를 한 곳에서 검색하세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
