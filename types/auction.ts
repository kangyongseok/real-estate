// 검색 기간 타입
export type SearchPeriodType = '01' | '02' | '03';

// 부동산 구분 타입
export type RealEstateType = '01' | '02' | '03' | 'all';

// 지역 코드
export interface Region {
  code: string;
  name: string;
}

// 시도
export interface City extends Region {
  districts: District[];
}

// 시군구
export interface District extends Region {}

// API 요청 파라미터
export interface AuctionSearchParams {
  search_type_api: SearchPeriodType;
  search_start_date_api: string;
  search_end_date_api: string;
  search_regn1_name_api?: string;
  search_regn2_name_api?: string;
  search_real_cls_api?: RealEstateType;
}

// API 응답 데이터
export interface AuctionData {
  resDate: string;
  adminRegn1Name: string;
  adminRegn2Name: string;
  tot: string;
}

// API 응답
export interface AuctionApiResponse {
  result: {
    head: {
      returnCode: string;
      returnMessage: string;
      totalCount: string;
    };
    items?: {
      item: AuctionData | AuctionData[];
    };
  };
}

// 프론트엔드 폼 데이터
export interface SearchFormData {
  periodType: SearchPeriodType;
  startDate: string;
  endDate: string;
  city: string;
  district: string;
  realEstateType: RealEstateType;
}

// 분양임대 공고 관련 타입
export interface LeaseNoticeSearchParams {
  PG_SZ: string;
  PAGE: string;
  PAN_NT_ST_DT: string;
  CLSG_DT: string;
  PAN_NM?: string;
  UPP_AIS_TP_CD?: string;
  CNP_CD?: string;
  PAN_SS?: string;
}

export interface LeaseNoticeData {
  RNUM: string;
  UPP_AIS_TP_NM: string;
  AIS_TP_CD_NM: string;
  PAN_NM: string;
  CNP_CD_NM: string;
  PAN_SS: string;
  DTL_URL: string;
  PAN_NT_ST_DT?: string;
}

export interface LeaseNoticeApiResponse {
  SS_CODE: string;
  RS_DTTM: string;
  ALL_CNT: string;
  list: LeaseNoticeData[];
}

export interface LeaseFormData {
  startDate: string;
  endDate: string;
  searchKeyword: string;
  noticeType: string;
  region: string;
  noticeStatus: string;
  page: number;
  pageSize: number;
}

// 청약홈 분양정보 관련 타입
export interface SubscriptionNoticeSearchParams {
  PG_SZ?: string;
  PAGE?: string;
  startmonth?: string;
  endmonth?: string;
  region?: string;
  housetype?: string;
}

export interface SubscriptionNoticeData {
  HOUSE_MANAGE_NO: string;
  PBLANC_NO: string;
  HOUSE_NM: string;
  HSSPLY_ADRES: string;
  SUBSCRPT_AREA_CODE_NM?: string;
  TOT_SUPLY_HSHLDCO: string;
  RCRIT_PBLANC_DE: string;
  SUBSCRPT_RCEPT_BGNDE?: string;
  SUBSCRPT_RCEPT_ENDDE?: string;
  PRZWNER_PRESNATN_DE?: string;
  CNTRCT_CNCLS_BGNDE?: string;
  CNTRCT_CNCLS_ENDDE?: string;
  HSSPLY_ZIP?: string;
  SPECLT_RDN_EARTH_AT?: string;
  MDHS_TELNO?: string;
  PBLANC_URL?: string;
}

// ODCloud API 응답 형식
export interface SubscriptionNoticeApiResponse {
  currentCount: number;
  data: SubscriptionNoticeData[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export interface SubscriptionFormData {
  startDate: string;
  endDate: string;
  region: string;
  houseType: string;
  page: number;
  pageSize: number;
}
