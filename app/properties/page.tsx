'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PropertiesPage() {
  const handleGoToCourtAuction = () => {
    window.open('https://www.courtauction.go.kr/pgj/index.on', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container py-6 md:py-10 space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">경매 물건 검색</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          법원경매정보 공식 사이트에서 전국 경매 물건 정보를 조회하세요.
        </p>
      </div>

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">대한민국 법원 경매정보</CardTitle>
          <CardDescription className="text-base">
            공식 사이트에서 전국의 경매 물건 정보를 상세하게 조회할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-5">
            <h3 className="font-semibold mb-3">제공 서비스</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { title: '물건상세검색', desc: '지역, 용도, 가격대별 상세 검색' },
                { title: '사건번호 검색', desc: '사건번호로 직접 조회' },
                { title: '지도검색', desc: '지도에서 위치 기반 검색' },
                { title: '실시간 정보', desc: '입찰일정, 진행상태 등' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-5">
            <h3 className="font-semibold mb-3">이용 안내</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>회원가입 불필요:</strong> 별도 가입 없이 누구나 무료로 이용 가능</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>전국 법원 정보:</strong> 전국 모든 법원의 경매 물건 정보 제공</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>상세 정보:</strong> 감정가, 최저입찰가, 물건 사진, 첨부 문서 등 확인</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>입찰 참여:</strong> 사이트에서 직접 인터넷 입찰 가능</span>
              </li>
            </ul>
          </div>

          <Button onClick={handleGoToCourtAuction} className="w-full" size="lg">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            법원경매정보 사이트로 이동
          </Button>

          <p className="text-center text-xs text-muted-foreground">www.courtauction.go.kr</p>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          경매 물건 검색 기능은 법원경매정보 공식 사이트를 이용해 주세요. 공식 사이트에서 가장 정확하고 최신의 정보를 확인하실 수 있습니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}
