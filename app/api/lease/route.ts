import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import type { LeaseNoticeApiResponse, LeaseNoticeData } from '@/types/auction';

export const dynamic = 'force-dynamic';

// XML 응답을 JSON으로 변환
async function parseXmlResponse(xmlData: string): Promise<LeaseNoticeApiResponse | null> {
  try {
    const result = await parseStringPromise(xmlData);
    
    // XML 구조 확인
    console.log('Parsed XML keys:', Object.keys(result));
    
    // 공공데이터 API의 일반적인 XML 구조
    if (result.response) {
      const header = result.response.header?.[0];
      const body = result.response.body?.[0];
      
      const resultCode = header?.resultCode?.[0] || '';
      const resultMsg = header?.resultMsg?.[0] || '';
      
      if (resultCode === '00') {
        // 성공
        const items = body?.items?.[0]?.item || [];
        const totalCount = body?.totalCount?.[0] || '0';
        
        const list: LeaseNoticeData[] = items.map((item: any) => ({
          RNUM: item.RNUM?.[0] || '',
          UPP_AIS_TP_NM: item.UPP_AIS_TP_NM?.[0] || '',
          AIS_TP_CD_NM: item.AIS_TP_CD_NM?.[0] || '',
          PAN_NM: item.PAN_NM?.[0] || '',
          CNP_CD_NM: item.CNP_CD_NM?.[0] || '',
          PAN_SS: item.PAN_SS?.[0] || '',
          DTL_URL: item.DTL_URL?.[0] || '',
          PAN_NT_ST_DT: item.PAN_NT_ST_DT?.[0] || '',
        }));
        
        return {
          SS_CODE: 'Y',
          RS_DTTM: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14),
          ALL_CNT: totalCount,
          list,
        };
      } else {
        console.error('XML API Error:', { resultCode, resultMsg });
        return null;
      }
    }
    
    // LH API의 JSON 형식 (직접 반환하는 경우)
    if (result.SS_CODE || result.list) {
      return result as unknown as LeaseNoticeApiResponse;
    }
    
    console.error('Unknown XML structure:', result);
    return null;
  } catch (error) {
    console.error('XML Parse Error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 필수 파라미터 검증
    const PG_SZ = searchParams.get('PG_SZ') || '10';
    const PAGE = searchParams.get('PAGE') || '1';
    const PAN_NT_ST_DT = searchParams.get('PAN_NT_ST_DT');
    const CLSG_DT = searchParams.get('CLSG_DT');

    if (!PAN_NT_ST_DT || !CLSG_DT) {
      return NextResponse.json(
        { error: '공고게시일과 공고마감일은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 선택 파라미터
    const PAN_NM = searchParams.get('PAN_NM');
    const UPP_AIS_TP_CD = searchParams.get('UPP_AIS_TP_CD');
    const CNP_CD = searchParams.get('CNP_CD');
    const PAN_SS = searchParams.get('PAN_SS');

    // API 키 확인
    const serviceKey = process.env.LH_API_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. README_LEASE.md를 참고하여 LH_API_KEY를 설정해주세요.' },
        { status: 500 }
      );
    }

    // 이미 인코딩된 키인지 확인 (% 기호 포함 여부)
    const isAlreadyEncoded = serviceKey.includes('%');
    
    // 기본 파라미터 구성
    const params: Record<string, string> = {
      PG_SZ,
      PAGE,
      PAN_NT_ST_DT,
      CLSG_DT,
    };

    // 선택 파라미터 추가
    if (PAN_NM) params.PAN_NM = PAN_NM;
    if (UPP_AIS_TP_CD) params.UPP_AIS_TP_CD = UPP_AIS_TP_CD;
    if (CNP_CD) params.CNP_CD = CNP_CD;
    if (PAN_SS) params.PAN_SS = PAN_SS;

    const baseUrl = 'http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1';
    let response;

    if (isAlreadyEncoded) {
      // 이미 인코딩된 키는 URL에 직접 포함
      const queryParams = new URLSearchParams(params).toString();
      const fullUrl = `${baseUrl}?ServiceKey=${serviceKey}&${queryParams}`;
      
      console.log('LH API Request (인코딩된 키):', { 
        baseUrl, 
        paramsCount: Object.keys(params).length,
        params: { ...params, ServiceKey: '[HIDDEN]' },
      });
      
      response = await axios.get(fullUrl, {
        timeout: 15000,
        responseType: 'text', // XML 응답을 텍스트로 받기
        validateStatus: (status) => status < 500,
      });
    } else {
      // 디코딩된 키는 params에 추가
      params.ServiceKey = serviceKey;
      
      console.log('LH API Request (디코딩된 키):', { 
        baseUrl, 
        paramsCount: Object.keys(params).length,
        params: { ...params, ServiceKey: '[HIDDEN]' },
      });
      
      response = await axios.get(baseUrl, {
        params,
        timeout: 15000,
        responseType: 'text', // XML 응답을 텍스트로 받기
        validateStatus: (status) => status < 500,
      });
    }

    console.log('LH API Response:', { 
      status: response.status,
      contentType: response.headers['content-type'],
      dataLength: typeof response.data === 'string' ? response.data.length : 'not string',
      dataPreview: typeof response.data === 'string' ? response.data.substring(0, 200) : 'N/A',
    });

    // 응답 확인
    if (response.status !== 200) {
      console.error('API returned non-200 status:', response.status);
      return NextResponse.json(
        { error: `API 오류: ${response.status}`, details: response.data },
        { status: response.status }
      );
    }

    let apiData: any = null;

    // JSON 응답 시도
    if (typeof response.data === 'object') {
      apiData = response.data;
    } 
    // XML 응답 처리
    else if (typeof response.data === 'string') {
      // JSON 문자열인 경우
      if (response.data.trim().startsWith('{') || response.data.trim().startsWith('[')) {
        try {
          apiData = JSON.parse(response.data);
        } catch (e) {
          console.error('JSON parse error:', e);
        }
      }
      // XML 문자열인 경우
      else if (response.data.trim().startsWith('<')) {
        const xmlResult = await parseXmlResponse(response.data);
        if (xmlResult) {
          apiData = xmlResult;
        }
      }
    }

    if (!apiData) {
      return NextResponse.json(
        { error: 'API 응답을 파싱할 수 없습니다.' },
        { status: 500 }
      );
    }

    // LH API의 배열 형식 응답 처리
    let parsedData: LeaseNoticeApiResponse;
    
    if (Array.isArray(apiData) && apiData.length >= 2) {
      // [{"dsSch": [...]}, {"dsList": [...], "resHeader": [...]}] 형식
      const resultData = apiData[1];
      const header = resultData.resHeader?.[0] || {};
      const list = resultData.dsList || [];
      
      console.log('LH Array Format:', {
        headerKeys: Object.keys(header),
        SS_CODE: header.SS_CODE,
        ALL_CNT: header.ALL_CNT,
        listLength: list.length,
      });
      
      // 첫 번째 항목 상세 로깅
      if (list.length > 0) {
        console.log('First item detail:', {
          PAN_NM: list[0].PAN_NM,
          UPP_AIS_TP_NM: list[0].UPP_AIS_TP_NM,
          AIS_TP_CD_NM: list[0].AIS_TP_CD_NM,
          CNP_CD_NM: list[0].CNP_CD_NM,
          PAN_SS: list[0].PAN_SS,
        });
      }
      
      // 리스트를 매핑
      const mappedList = list.map((item: any) => ({
        RNUM: item.RNUM || '',
        UPP_AIS_TP_NM: item.UPP_AIS_TP_NM || '',
        AIS_TP_CD_NM: item.AIS_TP_CD_NM || '',
        PAN_NM: item.PAN_NM || '',
        CNP_CD_NM: item.CNP_CD_NM || '',
        PAN_SS: item.PAN_SS || '',
        DTL_URL: item.DTL_URL || '',
        PAN_NT_ST_DT: item.PAN_NT_ST_DT || '',
      }));
      
      // 공고유형 필터링 (API가 제대로 필터링하지 않는 경우 대비)
      let filteredList = mappedList;
      if (UPP_AIS_TP_CD) {
        const typeMap: Record<string, string> = {
          '01': '토지',
          '05': '분양주택',
          '06': '임대주택',
          '13': '주거복지',
          '22': '상가',
          '39': '신혼희망타운',
        };
        const targetType = typeMap[UPP_AIS_TP_CD];
        if (targetType) {
          filteredList = mappedList.filter((item: any) => 
            item.UPP_AIS_TP_NM === targetType
          );
          console.log(`Filtered by type "${targetType}": ${mappedList.length} -> ${filteredList.length} items`);
        }
      }
      
      parsedData = {
        SS_CODE: header.SS_CODE || 'Y',
        RS_DTTM: header.RS_DTTM || '',
        ALL_CNT: header.ALL_CNT || String(filteredList.length),
        list: filteredList,
      };
    } else {
      // 일반 객체 형식
      parsedData = apiData as LeaseNoticeApiResponse;
    }

    console.log('Parsed API Data:', { 
      SS_CODE: parsedData.SS_CODE, 
      ALL_CNT: parsedData.ALL_CNT,
      listLength: parsedData.list?.length || 0,
    });

    // 성공 응답 (SS_CODE가 없거나 'Y'인 경우 성공으로 간주)
    if (!parsedData.SS_CODE || parsedData.SS_CODE === 'Y') {
      const list = parsedData.list || [];
      const totalCount = parseInt(parsedData.ALL_CNT || '0');

      return NextResponse.json({
        data: list,
        message: list.length === 0 ? '검색 결과가 없습니다.' : '조회 성공',
        totalCount,
        pageInfo: {
          currentPage: parseInt(PAGE),
          pageSize: parseInt(PG_SZ),
          totalPages: Math.ceil(totalCount / parseInt(PG_SZ)),
        },
      });
    }

    // 에러 응답
    return NextResponse.json(
      { error: 'API 조회에 실패했습니다.', code: parsedData.SS_CODE },
      { status: 400 }
    );

  } catch (error) {
    console.error('LH API Error:', error);
    
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
