import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '부동산 경매 통계',
  description: '법원 부동산 경매 통계를 지역별, 기간별, 용도별로 조회하세요. 낙찰률, 낙찰가율 등 경매 시장 동향을 한눈에 확인할 수 있습니다.',
  openGraph: {
    title: '부동산 경매 통계 | 부동산 정보',
    description: '법원 부동산 경매 통계를 지역별, 기간별, 용도별로 조회하세요. 낙찰률, 낙찰가율 등 경매 시장 동향을 한눈에 확인할 수 있습니다.',
  },
  twitter: {
    title: '부동산 경매 통계 | 부동산 정보',
    description: '법원 부동산 경매 통계를 지역별, 기간별, 용도별로 조회하세요. 낙찰률, 낙찰가율 등 경매 시장 동향을 한눈에 확인할 수 있습니다.',
  },
};

export default function AuctionStatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
