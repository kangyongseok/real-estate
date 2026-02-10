import { NextRequest, NextResponse } from 'next/server';
import { searchAuctionProperties } from '@/lib/auction-crawler';
import type { AuctionSearchParams } from '@/types/auction-detail';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 최대 120초 (크롤링 재시도 시간 고려)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 검색 조건 구성
    const params: AuctionSearchParams = {
      region: searchParams.get('region') || undefined,
      district: searchParams.get('district') || undefined,
      buildingType: searchParams.get('buildingType') || undefined,
      minPrice: searchParams.get('minPrice') 
        ? parseInt(searchParams.get('minPrice')!) 
        : undefined,
      maxPrice: searchParams.get('maxPrice') 
        ? parseInt(searchParams.get('maxPrice')!) 
        : undefined,
      minArea: searchParams.get('minArea') 
        ? parseFloat(searchParams.get('minArea')!) 
        : undefined,
      maxArea: searchParams.get('maxArea') 
        ? parseFloat(searchParams.get('maxArea')!) 
        : undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') 
        ? parseInt(searchParams.get('page')!) 
        : 1,
      limit: searchParams.get('limit') 
        ? parseInt(searchParams.get('limit')!) 
        : 20,
    };

    console.log('경매 검색 요청:', params);

    // 크롤링 실행
    const result = await searchAuctionProperties(params);

    // 페이지네이션 계산
    const limit = params.limit || 20;
    const page = params.page || 1;
    const totalPages = Math.ceil(result.total / limit);

    return NextResponse.json({
      success: true,
      properties: result.properties,
      total: result.total,
      page,
      totalPages,
      limit,
    });

  } catch (error) {
    console.error('경매 검색 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
