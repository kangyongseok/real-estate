import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LH 분양·임대 공고',
  description: '한국토지주택공사(LH)의 분양·임대 공고를 조회하세요. LH 임대아파트, 분양주택 등 다양한 주거 정보를 제공합니다.',
  openGraph: {
    title: 'LH 분양·임대 공고 | 부동산 정보',
    description: '한국토지주택공사(LH)의 분양·임대 공고를 조회하세요. LH 임대아파트, 분양주택 등 다양한 주거 정보를 제공합니다.',
  },
  twitter: {
    title: 'LH 분양·임대 공고 | 부동산 정보',
    description: '한국토지주택공사(LH)의 분양·임대 공고를 조회하세요. LH 임대아파트, 분양주택 등 다양한 주거 정보를 제공합니다.',
  },
};

export default function LeaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
