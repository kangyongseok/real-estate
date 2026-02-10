import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import type { SubscriptionNoticeData } from '@/types/auction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 파라미터 추출
    const numOfRows = searchParams.get('numOfRows') || '10';
    const pageNo = searchParams.get('pageNo') || '1';
    const startmonth = searchParams.get('startmonth');
    const endmonth = searchParams.get('endmonth');
    const region = searchParams.get('region');
    const houseSecd = searchParams.get('houseSecd');

    // 날짜 유효성 검사
    if (!startmonth || !endmonth) {
      return NextResponse.json(
        { error: '검색 기간은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // API 키 확인
    const serviceKey = process.env.SUBSCRIPTION_API_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. .env.local에 SUBSCRIPTION_API_KEY를 설정해주세요.' },
        { status: 500 }
      );
    }

    // 이미 인코딩된 키인지 확인
    const isAlreadyEncoded = serviceKey.includes('%');
    
    // 기본 파라미터 구성
    const params: Record<string, string> = {
      numOfRows,
      pageNo,
      startmonth,
      endmonth,
    };

    // 선택 파라미터 추가
    if (region) params.region = region;
    if (houseSecd) params.houseSecd = houseSecd;

    // API URL - 청약홈 분양정보 조회 API (공공데이터포털 ODCloud)
    const baseUrl = 'https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail';
    
    // ODCloud API는 cond 형식의 쿼리 파라미터 사용
    const apiParams: Record<string, string> = {
      page: pageNo,
      perPage: numOfRows,
      serviceKey: serviceKey,
    };

    // 날짜 필터 (RCRIT_PBLANC_DE: 모집공고일)
    if (startmonth) {
      // YYYYMM -> YYYY-MM-01 형식으로 변환
      const startYear = startmonth.substring(0, 4);
      const startMonth = startmonth.substring(4, 6);
      apiParams['cond[RCRIT_PBLANC_DE::GTE]'] = `${startYear}-${startMonth}-01`;
    }
    
    if (endmonth) {
      // YYYYMM -> YYYY-MM-말일 형식으로 변환
      const endYear = endmonth.substring(0, 4);
      const endMonth = endmonth.substring(4, 6);
      const lastDay = new Date(parseInt(endYear), parseInt(endMonth), 0).getDate();
      apiParams['cond[RCRIT_PBLANC_DE::LTE]'] = `${endYear}-${endMonth}-${String(lastDay).padStart(2, '0')}`;
    }

    // 지역 필터 (SUBSCRPT_AREA_CODE_NM 지역명 사용)
    if (region) {
      const regionNameMap: Record<string, string> = {
        '11': '서울',
        '26': '부산',
        '27': '대구',
        '28': '인천',
        '29': '광주',
        '30': '대전',
        '31': '울산',
        '36': '세종',
        '41': '경기',
        '42': '강원',
        '43': '충북',
        '44': '충남',
        '45': '전북',
        '46': '전남',
        '47': '경북',
        '48': '경남',
        '50': '제주',
      };
      
      const areaName = regionNameMap[region];
      if (areaName) {
        apiParams['cond[SUBSCRPT_AREA_CODE_NM::EQ]'] = areaName;
      }
    }

    // 주택구분 필터 (HOUSE_SECD)
    if (houseSecd) {
      apiParams['cond[HOUSE_SECD::EQ]'] = houseSecd;
    }

    console.log('청약홈 API Request:', { 
      baseUrl, 
      paramsCount: Object.keys(apiParams).length,
      params: { ...apiParams, serviceKey: '[HIDDEN]' },
    });

    const response = await axios.get(baseUrl, {
      params: apiParams,
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });

    console.log('청약홈 API Response:', { 
      status: response.status,
      contentType: response.headers['content-type'],
      dataType: typeof response.data,
      dataKeys: typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
    });

    // 응답 확인
    if (response.status !== 200) {
      console.error('API returned non-200 status:', response.status);
      console.error('API Error Response:', response.data);
      return NextResponse.json(
        { 
          error: `API 오류: ${response.status}`, 
          code: response.data?.code,
          message: response.data?.msg,
          details: response.data 
        },
        { status: response.status }
      );
    }

    // ODCloud API는 JSON 형식으로 응답
    const apiData = response.data;

    // 응답 구조 확인
    if (!apiData || typeof apiData !== 'object') {
      return NextResponse.json(
        { error: 'API 응답 형식이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    console.log('API Response Structure:', {
      currentCount: apiData.currentCount,
      totalCount: apiData.totalCount,
      dataLength: apiData.data?.length,
    });

    // ODCloud API 응답 구조: { currentCount, data, matchCount, page, perPage, totalCount }
    const itemList = apiData.data || [];
    const totalCount = apiData.totalCount || 0;

    // 데이터 매핑 (필요한 경우)
    const mappedList = itemList.map((item: any) => ({
      HOUSE_MANAGE_NO: item.HOUSE_MANAGE_NO || '',
      PBLANC_NO: item.PBLANC_NO || '',
      HOUSE_NM: item.HOUSE_NM || '',
      HSSPLY_ADRES: item.HSSPLY_ADRES || '',
      SUBSCRPT_AREA_CODE_NM: item.SUBSCRPT_AREA_CODE_NM || '',
      TOT_SUPLY_HSHLDCO: item.TOT_SUPLY_HSHLDCO || '0',
      RCRIT_PBLANC_DE: item.RCRIT_PBLANC_DE || '',
      SUBSCRPT_RCEPT_BGNDE: item.SUBSCRPT_RCEPT_BGNDE || '',
      SUBSCRPT_RCEPT_ENDDE: item.SUBSCRPT_RCEPT_ENDDE || '',
      PRZWNER_PRESNATN_DE: item.PRZWNER_PRESNATN_DE || '',
      CNTRCT_CNCLS_BGNDE: item.CNTRCT_CNCLS_BGNDE || '',
      CNTRCT_CNCLS_ENDDE: item.CNTRCT_CNCLS_ENDDE || '',
      HSSPLY_ZIP: item.HSSPLY_ZIP || '',
      SPECLT_RDN_EARTH_AT: item.SPECLT_RDN_EARTH_AT || '',
      MDHS_TELNO: item.MDHS_TELNO || '',
      PBLANC_URL: item.PBLANC_URL || '',
    }));

    return NextResponse.json({
      data: mappedList,
      message: '조회 성공',
      totalCount,
      pageInfo: {
        currentPage: parseInt(pageNo),
        pageSize: parseInt(numOfRows),
        totalPages: Math.ceil(totalCount / parseInt(numOfRows)),
      },
    });

  } catch (error) {
    console.error('청약홈 API Error:', error);
    
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data || error.message;
      
      console.error('Axios Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: typeof error.response?.data === 'string' 
          ? error.response.data.substring(0, 500) 
          : error.response?.data,
      });
      
      return NextResponse.json(
        { 
          error: 'API 요청 중 오류가 발생했습니다.', 
          details: errorMessage,
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
