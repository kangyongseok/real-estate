# 부동산 경매 & 분양임대 통합 검색 서비스

서울 및 경기 지역의 경매 정보와 한국토지주택공사(LH)의 분양·임대 공고를 검색할 수 있는 통합 웹 애플리케이션입니다.

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: React DatePicker
- **API**: 
  - 대한민국 법원 등기정보광장 Open API
  - 한국토지주택공사 분양임대공고 Open API
- **HTTP Client**: Axios
- **Date Utility**: date-fns

## 주요 기능

### 📊 경매 통계 조회
- 📅 **달력 UI로 날짜 선택**
  - 연도별 검색: 연도 선택기
  - 월별 검색: 연도/월 선택기
  - 일별 검색: 전체 날짜 선택기
  - 한국어 로케일 지원
  - 진한 텍스트 색상으로 가독성 향상
- 🏙️ **지역별 검색** (서울/경기 시도 및 시군구)
- 🏢 **부동산 구분별 검색** (건물/집합건물/토지)
- 📊 **검색 결과** 
  - 테이블 형식으로 표시
  - **각 행 클릭 시 상세 정보 확장**
  - 조회 일자, 지역, 부동산 구분, 검색 조건 등 표시
  - 부드러운 애니메이션 효과

### 🔍 경매 물건 검색
- 상세 필터링: 지역, 건물유형, 가격, 면적
- 경매 물건 상세 정보 조회
- 물건별 상세 페이지 제공

### 🏘️ 분양·임대 공고 조회 (신규!)
- 📅 **공고일자별 검색** (공고게시일, 공고마감일)
- 🏢 **공고유형별 검색** (분양주택, 임대주택)
- 🗺️ **지역별 검색** (전국 17개 시도)
- 🔍 **공고명 키워드 검색**
- 📋 **공고상태별 필터링** (공고중, 공고마감)
- 📄 **페이지네이션 지원**
- 🔗 **공고 상세 페이지 바로가기**
- 💻 **모던하고 직관적인 UI**

### 공통 기능
- 💻 **반응형 디자인** 모바일 최적화
- 🎨 **모던한 UI/UX** (Gradient 배경, 카드 레이아웃)
- 🔄 **페이지 간 편리한 네비게이션**

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install
```

### 환경 설정

`.env.local` 파일 설정:

```env
# 대한민국 법원 등기정보광장 API
IROS_API_KEY=e130bdaabb2a4e44b18d32ea34779542
IROS_API_BASE_URL=https://data.iros.go.kr
IROS_SERVICE_ID=0000000087

# 한국토지주택공사 (LH) 분양임대 공고 API
# https://www.data.go.kr/data/15058530/openapi.do 에서 발급받은 인증키 입력
LH_API_KEY=YOUR_API_KEY_HERE
```

**분양·임대 공고 기능 사용을 위해서는**:
1. [공공데이터포털](https://www.data.go.kr/data/15058530/openapi.do)에서 API 키 발급
2. `.env.local` 파일의 `LH_API_KEY`에 일반 인증키(Decoding) 입력
3. 자세한 설정 방법은 [README_LEASE.md](./README_LEASE.md) 참조

### 실행

```bash
# 개발 서버 실행 (포트 3001)
PORT=3001 npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

애플리케이션은 기본적으로 [http://localhost:3001](http://localhost:3001)에서 실행됩니다.

## 프로젝트 구조

```
auction/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auction/       # 경매 검색 API
│   │   │   ├── route.ts         # 경매 통계 조회
│   │   │   ├── search/route.ts  # 경매 물건 검색
│   │   │   └── detail/[caseNumber]/route.ts # 경매 물건 상세
│   │   └── lease/         # 분양임대 공고 API
│   │       └── route.ts         # LH 공고 조회
│   ├── properties/        # 경매 물건 검색 페이지
│   │   ├── page.tsx             # 검색 페이지
│   │   └── [caseNumber]/page.tsx # 상세 페이지
│   ├── lease/             # 분양임대 공고 페이지
│   │   └── page.tsx             # 공고 조회 페이지
│   ├── globals.css        # 글로벌 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지 (경매 통계)
├── constants/             # 상수 정의
│   └── regions.ts         # 지역 코드 및 옵션
├── types/                 # TypeScript 타입 정의
│   ├── auction.ts         # 경매 & 분양임대 관련 타입
│   └── auction-detail.ts  # 경매 물건 상세 타입
├── .env.local            # 환경 변수
├── README.md             # 프로젝트 메인 문서
├── README_LEASE.md       # 분양임대 기능 상세 문서
├── README_PROPERTIES.md  # 경매 물건 검색 상세 문서
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

## API 사용법

### 검색 파라미터

#### 필수 파라미터
- `search_type_api`: 검색 기간 구분
  - `01`: 연도별
  - `02`: 월별
  - `03`: 일별
- `search_start_date_api`: 검색 시작 기간
  - 연도별: `2024`
  - 월별: `202401`
  - 일별: `20240101`
- `search_end_date_api`: 검색 종료 기간

#### 선택 파라미터
- `search_regn1_name_api`: 시도 코드
  - `900`: 서울특별시
  - `200`: 경기도
- `search_regn2_name_api`: 시군구 코드
- `search_real_cls_api`: 부동산 구분
  - `01`: 건물
  - `02`: 집합건물
  - `03`: 토지

### API 엔드포인트

```
GET /api/auction?search_type_api=03&search_start_date_api=20240101&search_end_date_api=20240131
```

### 응답 예시

```json
{
  "data": [
    {
      "resDate": "20240101",
      "adminRegn1Name": "서울특별시",
      "adminRegn2Name": "강남구",
      "tot": "15"
    }
  ],
  "message": "조회 성공"
}
```

## 주요 컴포넌트

### 검색 폼
- 기간 타입 선택 (라디오 버튼)
  - 연도별, 월별, 일별 중 선택
- 시작/종료 날짜 선택 (달력 UI)
  - 기간 타입에 따라 자동으로 적절한 선택기 표시
  - 시작 날짜 이후만 종료 날짜로 선택 가능
  - 오늘 날짜까지만 선택 가능
- 시도/시군구 선택 (드롭다운)
- 부동산 구분 선택 (라디오 버튼)

### 결과 테이블
- 일자별 경매 건수 표시
- 지역별 그룹핑
- 반응형 테이블 디자인
- **확장 가능한 행**
  - 각 행 클릭 시 상세 정보 표시
  - 화살표 아이콘으로 확장 상태 표시
  - 조회 조건 및 통계 정보 표시
  - 블루 하이라이트로 선택된 행 강조

## 에러 처리

- API 파라미터 유효성 검증
- 네트워크 오류 처리
- 사용자 친화적인 에러 메시지 표시
- 데이터 없을 때 안내 메시지

## 코딩 컨벤션

### 네이밍
- 변수/함수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- 컴포넌트/타입: `PascalCase`
- 파일명: `kebab-case`
- Boolean: `is/has/can` 접두사

### 코드 스타일
- 함수 길이: 50줄 이내 권장
- 중첩 깊이: 3단계 이내
- 매직 넘버 금지
- Early return 패턴 사용

## 라이선스

Private

## 페이지 구성

### 메인 페이지 (`/`)
- 경매 통계 조회
- 날짜별/지역별/부동산구분별 통계
- 확장 가능한 상세 정보

### 경매 물건 검색 (`/properties`)
- 상세 필터링 검색
- 물건 목록 조회
- 상세 페이지 링크

### 경매 물건 상세 (`/properties/[caseNumber]`)
- 물건 상세 정보
- 사건번호별 조회

### 분양·임대 공고 조회 (`/lease`) ⭐ NEW
- LH 공고 검색
- 날짜/지역/유형별 필터링
- 페이지네이션
- 공고 상세 페이지 바로가기

## 📚 상세 문서

- [분양·임대 공고 기능 가이드](./README_LEASE.md)
- [경매 물건 검색 가이드](./README_PROPERTIES.md)

## 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [대한민국 법원 등기정보광장](https://data.iros.go.kr)
- [공공데이터포털 - LH 분양임대공고](https://www.data.go.kr/data/15058530/openapi.do)
- [한국토지주택공사 청약센터](https://apply.lh.or.kr/)
- [Tailwind CSS](https://tailwindcss.com/docs)
