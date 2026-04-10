import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/layout/site-header';
import GoogleAnalytics from '@/components/analytics/google-analytics';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: '부동산 정보 - 청약·분양·경매',
    template: '%s | 부동산 정보',
  },
  description: '청약홈 분양정보, LH 분양·임대, 부동산 경매 통계 및 법원 경매 물건을 한 곳에서 검색하세요.',
  openGraph: {
    type: 'website',
    siteName: '부동산 정보',
    title: '부동산 정보 - 청약·분양·경매',
    description: '청약홈 분양정보, LH 분양·임대, 부동산 경매 통계 및 법원 경매 물건을 한 곳에서 검색하세요.',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: '부동산 정보 - 청약·분양·경매',
    description: '청약홈 분양정보, LH 분양·임대, 부동산 경매 통계 및 법원 경매 물건을 한 곳에서 검색하세요.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <GoogleAnalytics />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
