# 청약홈 분양정보 조회 서비스

한국부동산원 청약홈에서 제공하는 APT, 오피스텔, 민간임대 등의 분양정보를 조회할 수 있는 서비스입니다.

## 기능

- APT, 민간사전청약, 신혼희망타운 등 주택유형별 분양정보 조회
- 지역별 필터링 (17개 시도)
- 공고 기간별 검색 (기본 3개월, 월 단위)
- 페이지네이션 지원
- 상세정보 링크 제공

## 설정 방법

### 1. API 키 발급

1. [공공데이터포털](https://www.data.go.kr/)에 접속하여 회원가입 및 로그인
2. [한국부동산원_청약홈 분양정보 조회 서비스](https://www.data.go.kr/data/15098547/openapi.do) 페이지 접속
3. '활용신청' 버튼 클릭
4. 개발계정 신청 (자동승인)
5. 마이페이지 > 오픈API > 개발계정 상세에서 일반 인증키(Encoding) 확인

### 2. 환경 변수 설정

`.env.local` 파일에 발급받은 API 키를 추가합니다:

```bash
# 한국부동산원 청약홈 분양정보 조회 API
# https://www.data.go.kr/data/15098547/openapi.do 에서 발급받은 인증키 입력
SUBSCRIPTION_API_KEY=your_encoded_api_key_here
```

## 사용 방법

### 검색 조건

1. **검색 기간** (필수)
   - 시작월과 종료월을 선택합니다
   - 기본값: 현재일 기준 3개월 전부터 현재월까지
   - 형식: YYYYMM (예: 202401)

2. **지역** (선택)
   - 전국 또는 특정 시도 선택
   - 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주

3. **주택구분** (선택)
   - 전체, APT, 오피스텔, 도시형생활주택, 민간임대, 공공지원민간임대

### 검색 결과

각 분양 공고에서 다음 정보를 확인할 수 있습니다:

- 주택명
- 주소
- 공급지역
- 공급 세대수
- 모집공고일
- 청약접수기간
- 당첨자발표일
- 계약체결기간
- 문의전화
- 상세정보 링크

## API 엔드포인트

### GET /api/subscription

청약홈 분양정보를 조회합니다.

**기본 URL:** `https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail`

**요청 파라미터:**

| 파라미터 | 필수 | 타입 | 설명 | 예시 |
|---------|------|------|------|------|
| startmonth | O | string | 검색 시작월 (YYYYMM) | 202310 |
| endmonth | O | string | 검색 종료월 (YYYYMM) | 202401 |
| region | X | string | 지역코드 (시도) | 11 (서울) |
| houseSecd | X | string | 주택구분코드 | 01 (APT) |
| pageNo | X | string | 페이지 번호 | 1 |
| numOfRows | X | string | 페이지당 결과 수 | 10 |

**ODCloud API 원본 응답 예시:**

```json
{
  "currentCount": 10,
  "data": [
    {
      "HOUSE_MANAGE_NO": "2024000001",
      "PBLANC_NO": "2024000001",
      "HOUSE_NM": "서울 강남 푸르지오",
      "HSSPLY_ADRES": "서울특별시 강남구 테헤란로 123",
      "SUBSCRPT_AREA_CODE_NM": "서울",
      "TOT_SUPLY_HSHLDCO": "500",
      "RCRIT_PBLANC_DE": "2024-01-15",
      "SUBSCRPT_RCEPT_BGNDE": "2024-01-20",
      "SUBSCRPT_RCEPT_ENDDE": "2024-01-22",
      "PRZWNER_PRESNATN_DE": "2024-01-30",
      "CNTRCT_CNCLS_BGNDE": "2024-02-05",
      "CNTRCT_CNCLS_ENDDE": "2024-02-10",
      "MDHS_TELNO": "02-1234-5678",
      "PBLANC_URL": "https://www.applyhome.co.kr/..."
    }
  ],
  "matchCount": 150,
  "page": 1,
  "perPage": 10,
  "totalCount": 150
}
```

**프론트엔드 응답 예시 (변환 후):**

```json
{
  "data": [
    {
      "HOUSE_MANAGE_NO": "2024000001",
      "PBLANC_NO": "2024000001",
      "HOUSE_NM": "서울 강남 푸르지오",
      "HSSPLY_ADRES": "서울특별시 강남구 테헤란로 123",
      "SUBSCRPT_AREA_CODE_NM": "서울",
      "TOT_SUPLY_HSHLDCO": "500",
      "RCRIT_PBLANC_DE": "2024-01-15",
      "SUBSCRPT_RCEPT_BGNDE": "2024-01-20",
      "SUBSCRPT_RCEPT_ENDDE": "2024-01-22",
      "PRZWNER_PRESNATN_DE": "2024-01-30",
      "MDHS_TELNO": "02-1234-5678",
      "PBLANC_URL": "https://www.applyhome.co.kr/..."
    }
  ],
  "message": "조회 성공",
  "totalCount": 150,
  "pageInfo": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 15
  }
}
```

## 주택구분 코드 (HOUSE_SECD)

| 코드 | 명칭 |
|-----|------|
| 01 | APT |
| 09 | 민간사전청약 |
| 10 | 신혼희망타운 |

## 주택상세구분 코드 (HOUSE_DTL_SECD)

오피스텔/도시형/생활숙박시설/민간임대의 경우:

| 코드 | 명칭 |
|-----|------|
| 0201 | 도시형생활주택 |
| 0202 | 오피스텔 |
| 0203 | 민간임대 |
| 0204 | 생활형숙박시설 |

## 지역 코드

### 프론트엔드 입력 (시도 코드)

| 코드 | 지역명 | 공급지역 코드 (SUBSCRPT_AREA_CODE) |
|-----|--------|--------------------------------|
| 11 | 서울 | 100 |
| 26 | 부산 | 600 |
| 27 | 대구 | 700 |
| 28 | 인천 | 400 |
| 29 | 광주 | 500 |
| 30 | 대전 | 300 |
| 31 | 울산 | 680 |
| 36 | 세종 | 338 |
| 41 | 경기 | 410 |
| 42 | 강원 | 200 |
| 43 | 충북 | 360 |
| 44 | 충남 | 312 |
| 45 | 전북 | 560 |
| 46 | 전남 | 513 |
| 47 | 경북 | 712 |
| 48 | 경남 | 621 |
| 50 | 제주 | 690 |

**참고:** 프론트엔드에서는 시도 코드를 사용하고, 백엔드에서 자동으로 공급지역 코드로 변환합니다.

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Date Picker**: react-datepicker
- **API**: 한국부동산원 청약홈 Open API (ODCloud)
- **HTTP Client**: axios

## API 사용 예제

### 서울 지역 APT 검색 (2024년 1월~3월)

```bash
GET /api/subscription?startmonth=202401&endmonth=202403&region=11&houseSecd=01&pageNo=1&numOfRows=10
```

### 전국 신혼희망타운 검색

```bash
GET /api/subscription?startmonth=202401&endmonth=202403&houseSecd=10&pageNo=1&numOfRows=10
```

### 경기 지역 전체 주택 검색

```bash
GET /api/subscription?startmonth=202401&endmonth=202403&region=41&pageNo=1&numOfRows=10
```

## 참고 자료

- [공공데이터포털 - 한국부동산원 청약홈 분양정보 조회 서비스](https://www.data.go.kr/data/15098547/openapi.do)
- [기술문서 (한국부동산원)](https://www.reb.or.kr/reb/na/ntt/selectNttInfo.do?mi=10251&bbsId=1268&nttSn=79889)
- [청약홈 공식 사이트](https://www.applyhome.co.kr/)
- [ODCloud API 문서](https://www.data.go.kr/ugs/selectPortalPolicyView.do)

## 주의사항

1. **API 플랫폼**: ODCloud 기반의 API를 사용합니다.
2. **인증키**: 일반 인증키(Encoding)를 사용해야 합니다.
3. **트래픽 제한**: 개발계정은 일일 40,000건 제한이 있습니다.
4. **운영계정**: 활용사례 등록 후 심의승인이 필요합니다.
5. **검색 기간**: 월 단위(YYYYMM)로 검색하며, 모집공고일(RCRIT_PBLANC_DE) 기준입니다.
6. **지역 코드**: 시도 코드 입력 시 자동으로 공급지역 코드로 변환됩니다.
7. **응답 형식**: JSON 형식으로 응답합니다 (XML 아님).
8. **상세정보**: PBLANC_URL을 통해 청약홈 사이트로 연결됩니다.

## 트러블슈팅

### API 키 오류

```
ERROR: API 키가 설정되지 않았습니다
```

→ `.env.local` 파일에 `SUBSCRIPTION_API_KEY`가 올바르게 설정되어 있는지 확인하세요.

### 인증 오류

```
ERROR: SERVICE_KEY_IS_NOT_REGISTERED_ERROR
```

→ API 키가 올바른지, 활용신청이 승인되었는지 확인하세요.

### 검색 결과 없음

- 검색 기간을 넓게 설정해보세요
- 지역 또는 주택구분 필터를 제거하고 전체로 검색해보세요
- 해당 기간에 실제 분양 공고가 없을 수 있습니다

## 라이선스

이 프로젝트는 공공데이터를 활용하며, API 이용에 대한 저작권은 한국부동산원에 있습니다.
