// 경매 물건 상세 정보 타입
export interface AuctionProperty {
  caseNumber: string;          // 사건번호
  courtName: string;           // 법원명
  address: string;             // 소재지 (정확한 주소)
  buildingType: string;        // 물건종류 (아파트, 빌라 등)
  buildYear?: string;          // 건축년도
  area: {
    exclusive?: number;        // 전용면적 (㎡)
    supply?: number;           // 공급면적 (㎡)
    exclusivePyeong?: number;  // 전용평수
    supplyPyeong?: number;     // 공급평수
  };
  appraisalValue?: number;     // 감정가
  minimumBidPrice?: number;    // 최저입찰가
  bidDate?: string;            // 입찰일시
  facilities?: string[];       // 부대시설
  complexInfo?: {
    name?: string;             // 단지명/아파트명
    totalUnits?: number;       // 총 세대수
    buildingCount?: number;    // 동수
  };
  location?: {
    description?: string;      // 입지 설명
    nearbyFacilities?: string[]; // 주변시설
    transportation?: string;   // 교통정보
  };
  images?: string[];           // 물건 이미지 URL
  status?: string;             // 진행상태
  biddingCount?: number;       // 입찰횟수
  url?: string;                // 상세 페이지 URL
}

// 경매 검색 조건
export interface AuctionSearchParams {
  region?: string;             // 지역 (서울, 경기)
  district?: string;           // 시군구
  buildingType?: string;       // 물건종류
  minPrice?: number;           // 최저가
  maxPrice?: number;           // 최고가
  minArea?: number;            // 최소면적
  maxArea?: number;            // 최대면적
  status?: string;             // 진행상태
  page?: number;               // 페이지
  limit?: number;              // 페이지당 개수
}

// 경매 물건 목록 응답
export interface AuctionListResponse {
  properties: AuctionProperty[];
  total: number;
  page: number;
  totalPages: number;
}
