import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { AuctionApiResponse, AuctionSearchParams } from '@/types/auction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 필수 파라미터 검증
    const search_type_api = searchParams.get('search_type_api');
    const search_start_date_api = searchParams.get('search_start_date_api');
    const search_end_date_api = searchParams.get('search_end_date_api');

    if (!search_type_api || !search_start_date_api || !search_end_date_api) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 선택 파라미터
    const search_regn1_name_api = searchParams.get('search_regn1_name_api');
    const search_regn2_name_api = searchParams.get('search_regn2_name_api');
    const search_real_cls_api = searchParams.get('search_real_cls_api');

    // API 요청 파라미터 구성
    const params: Record<string, string> = {
      id: process.env.IROS_SERVICE_ID || '0000000087',
      reqtype: 'json',
      key: process.env.IROS_API_KEY || '',
      search_type_api,
      search_start_date_api,
      search_end_date_api,
    };

    // 선택 파라미터 추가
    if (search_regn1_name_api && search_regn1_name_api !== 'all') {
      params.search_regn1_name_api = search_regn1_name_api;
    }
    if (search_regn2_name_api && search_regn2_name_api !== 'all') {
      params.search_regn2_name_api = search_regn2_name_api;
    }
    if (search_real_cls_api && search_real_cls_api !== 'all') {
      params.search_real_cls_api = search_real_cls_api;
    }

    // API 호출
    const apiUrl = `${process.env.IROS_API_BASE_URL}/openapi/cr/rs/selectCrRsRgsCsOpenApi.rest`;
    
    console.log('API Request:', { url: apiUrl, params });

    const response = await axios.get<AuctionApiResponse>(apiUrl, {
      params,
      timeout: 10000,
    });

    console.log('API Response:', response.data);

    // 응답 데이터 검증
    if (!response.data.result) {
      return NextResponse.json(
        { error: 'API 응답 형식이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    const { head, items } = response.data.result;

    // 에러 처리
    if (head.returnCode !== 'APIINFO-0001') {
      return NextResponse.json(
        { error: head.returnMessage, code: head.returnCode },
        { status: 400 }
      );
    }

    // 데이터가 없는 경우
    if (!items || !items.item) {
      return NextResponse.json({
        data: [],
        message: '검색 결과가 없습니다.',
        totalCount: 0,
      });
    }

    // item이 배열이 아닌 경우 배열로 변환
    const itemList = Array.isArray(items.item) 
      ? items.item 
      : [items.item];

    return NextResponse.json({
      data: itemList,
      message: '조회 성공',
      totalCount: parseInt(head.totalCount || '0'),
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { 
          error: 'API 요청 중 오류가 발생했습니다.', 
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
