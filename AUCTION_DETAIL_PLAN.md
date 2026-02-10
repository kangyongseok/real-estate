# 부동산 경매 상세 정보 구현 계획

## 현재 상황

### 사용 중인 API
- **API**: 대한민국 법원 등기정보광장 - 강제경매개시결정등기 신청 부동산 현황
- **제공 데이터**: 통계 데이터 (날짜별/지역별 경매 건수)
- **한계**: 개별 물건의 상세 정보 미제공

### 사용자 요구사항
1. 건축년도
2. 아파트명
3. 평수 (전용면적/공급면적)
4. 부대시설 정보
5. 총 세대수
6. 주변 입지
7. 정확한 주소

## 해결 방안

### 방안 1: 법원경매정보 사이트 크롤링 (추천) ⭐

**사이트**: https://www.courtauction.go.kr/

**장점**:
- 모든 상세 정보 제공
- 실시간 업데이트
- 이미지 및 감정평가서 제공
- 입찰 정보, 배당 정보 등 포함

**단점**:
- 공식 API 없음 (웹 크롤링 필요)
- 크롤링 제한 정책 준수 필요
- 유지보수 필요

**구현 방법**:
1. Puppeteer 또는 Playwright 사용
2. 검색 조건으로 물건 조회
3. 상세 페이지 파싱
4. 데이터베이스 저장 (선택)

**필요 라이브러리**:
```bash
npm install playwright cheerio
```

### 방안 2: 사법정보공유포털 API 활용

**사이트**: https://openapi.scourt.go.kr/

**필요 절차**:
1. 회원가입
2. API 신청 및 승인
3. API 키 발급
4. 연계 API 담당자 문의 (publicapi@scourt.go.kr)

**장점**:
- 공식 API
- 안정적인 서비스

**단점**:
- 승인 절차 필요
- 제공 데이터 범위 확인 필요
- 추가 비용 발생 가능

### 방안 3: 부동산 정보 API 연동

**옵션**:
1. 국토교통부 공동주택 정보
2. 한국부동산원 API
3. 상용 부동산 API 서비스

**장점**:
- 건축년도, 세대수 등 건물 정보 제공
- 공식 데이터

**단점**:
- 경매 정보와 별도 연동 필요
- 주소 매칭 작업 필요

## 권장 구현 단계

### Phase 1: 기본 크롤링 구현 (1-2일)

```typescript
// 법원경매정보 크롤러 기본 구조
interface AuctionDetail {
  caseNumber: string;        // 사건번호
  courtName: string;          // 법원명
  address: string;            // 소재지
  buildingType: string;       // 물건종류 (아파트, 빌라 등)
  buildYear: string;          // 건축년도
  area: {
    exclusive: number;        // 전용면적
    supply: number;           // 공급면적
  };
  appraisalValue: number;     // 감정가
  minimumBidPrice: number;    // 최저입찰가
  bidDate: string;            // 입찰일시
  facilities: string[];       // 부대시설
  complexInfo: {
    name: string;             // 단지명
    totalUnits: number;       // 총 세대수
  };
  location: {
    description: string;      // 입지 설명
    nearbyFacilities: string[]; // 주변시설
  };
  images: string[];           // 물건 이미지
  documents: string[];        // 관련 문서
}
```

### Phase 2: API 엔드포인트 구현 (0.5일)

```typescript
// /api/auction/detail/[caseNumber]/route.ts
// 사건번호로 상세 정보 조회
GET /api/auction/detail/2024타경12345

// 검색 조건으로 물건 목록 조회
GET /api/auction/search?region=서울&type=아파트&minPrice=10000
```

### Phase 3: UI 구현 (1일)

1. 검색 결과에서 물건 클릭 시 상세 페이지 이동
2. 상세 정보 표시:
   - 물건 기본 정보
   - 위치 정보 및 지도
   - 입찰 정보
   - 감정평가 내역
   - 이미지 갤러리
3. 관심 물건 저장 기능 (선택)

### Phase 4: 데이터베이스 연동 (선택, 1-2일)

```sql
CREATE TABLE auction_properties (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(50) UNIQUE,
  court_name VARCHAR(100),
  address TEXT,
  building_type VARCHAR(50),
  build_year INT,
  exclusive_area DECIMAL,
  supply_area DECIMAL,
  appraisal_value BIGINT,
  minimum_bid_price BIGINT,
  bid_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 법률적 고려사항

### 크롤링 관련
1. ✅ robots.txt 확인 및 준수
2. ✅ 합리적인 요청 간격 (Rate Limiting)
3. ✅ User-Agent 명시
4. ✅ 저작권 및 이용약관 준수

### 개인정보 보호
1. ❌ 개인정보 수집/저장 금지
2. ✅ 공개된 경매 정보만 활용
3. ✅ 데이터 보안 조치

## 비용 및 리소스

### 무료 방안
- 법원경매정보 사이트 크롤링
- 직접 구현 및 운영

### 유료 방안
- 상용 경매 정보 API 서비스 (월 10만원~)
- 전문 크롤링 서비스 이용

## 구현 우선순위

1. **높음**: 법원경매정보 크롤링 기본 구현
2. **중간**: 상세 정보 UI 개선
3. **낮음**: 데이터베이스 저장 및 캐싱
4. **선택**: 알림 기능, 관심 물건 관리

## 다음 단계

원하시는 방향을 선택해주세요:

### 옵션 A: 빠른 프로토타입 (1일)
- 법원경매정보 사이트 크롤링 기본 구현
- 주요 정보만 표시 (주소, 평수, 감정가)
- 단순 테이블 형태

### 옵션 B: 완전한 구현 (3-4일)
- 전체 상세 정보 크롤링
- 이미지 갤러리
- 위치 지도 연동
- 입찰 정보 및 히스토리

### 옵션 C: 공식 API 신청 (1-2주)
- 사법정보공유포털 API 신청
- 승인 대기
- API 연동 구현

어떤 방향으로 진행하시겠습니까?
