import { NextRequest, NextResponse } from 'next/server';
import { getAuctionPropertyDetail } from '@/lib/auction-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 최대 60초 (크롤링 시간 고려)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseNumber: string }> }
) {
  try {
    const { caseNumber } = await params;

    if (!caseNumber) {
      return NextResponse.json(
        { success: false, error: '사건번호가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('경매 상세 정보 요청:', caseNumber);

    // 크롤링 실행
    const property = await getAuctionPropertyDetail(caseNumber);

    if (!property) {
      return NextResponse.json(
        { success: false, error: '물건 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });

  } catch (error) {
    console.error('경매 상세 정보 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상세 정보 조회 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
