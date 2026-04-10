import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '법원 경매 물건 검색',
  description: '법원 부동산 경매 물건을 검색하세요. 지역, 용도, 사건번호로 경매 물건을 조회하고 입찰 일정 및 진행 상태를 확인할 수 있습니다.',
  openGraph: {
    title: '법원 경매 물건 검색 | 부동산 정보',
    description: '법원 부동산 경매 물건을 검색하세요. 지역, 용도, 사건번호로 경매 물건을 조회하고 입찰 일정 및 진행 상태를 확인할 수 있습니다.',
  },
  twitter: {
    title: '법원 경매 물건 검색 | 부동산 정보',
    description: '법원 부동산 경매 물건을 검색하세요. 지역, 용도, 사건번호로 경매 물건을 조회하고 입찰 일정 및 진행 상태를 확인할 수 있습니다.',
  },
};

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
