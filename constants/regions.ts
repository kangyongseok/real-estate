import { City } from '@/types/auction';

// 서울과 경기 지역 데이터
export const REGIONS: City[] = [
  {
    code: '900',
    name: '서울특별시',
    districts: [
      { code: '901', name: '종로구' },
      { code: '902', name: '중구' },
      { code: '903', name: '용산구' },
      { code: '904', name: '성동구' },
      { code: '905', name: '광진구' },
      { code: '906', name: '동대문구' },
      { code: '907', name: '중랑구' },
      { code: '908', name: '성북구' },
      { code: '909', name: '강북구' },
      { code: '910', name: '도봉구' },
      { code: '911', name: '노원구' },
      { code: '912', name: '은평구' },
      { code: '913', name: '서대문구' },
      { code: '914', name: '마포구' },
      { code: '915', name: '양천구' },
      { code: '916', name: '강서구' },
      { code: '917', name: '구로구' },
      { code: '918', name: '금천구' },
      { code: '919', name: '영등포구' },
      { code: '920', name: '동작구' },
      { code: '921', name: '관악구' },
      { code: '922', name: '서초구' },
      { code: '923', name: '강남구' },
      { code: '924', name: '송파구' },
      { code: '925', name: '강동구' },
    ],
  },
  {
    code: '200',
    name: '경기도',
    districts: [
      { code: '201', name: '수원시' },
      { code: '202', name: '성남시' },
      { code: '203', name: '의정부시' },
      { code: '204', name: '안양시' },
      { code: '205', name: '부천시' },
      { code: '206', name: '광명시' },
      { code: '207', name: '평택시' },
      { code: '208', name: '동두천시' },
      { code: '209', name: '안산시' },
      { code: '210', name: '고양시' },
      { code: '211', name: '과천시' },
      { code: '212', name: '구리시' },
      { code: '213', name: '남양주시' },
      { code: '214', name: '오산시' },
      { code: '215', name: '시흥시' },
      { code: '216', name: '군포시' },
      { code: '217', name: '의왕시' },
      { code: '218', name: '하남시' },
      { code: '219', name: '용인시' },
      { code: '220', name: '파주시' },
      { code: '221', name: '이천시' },
      { code: '222', name: '안성시' },
      { code: '223', name: '김포시' },
      { code: '224', name: '화성시' },
      { code: '225', name: '광주시' },
      { code: '226', name: '양주시' },
      { code: '227', name: '포천시' },
      { code: '228', name: '여주시' },
      { code: '229', name: '연천군' },
      { code: '230', name: '가평군' },
      { code: '231', name: '양평군' },
    ],
  },
];

// 부동산 구분
export const REAL_ESTATE_TYPES = [
  { value: 'all', label: '전체' },
  { value: '01', label: '건물' },
  { value: '02', label: '집합건물' },
  { value: '03', label: '토지' },
];

// 검색 기간 타입
export const PERIOD_TYPES = [
  { value: '01', label: '연도별', format: 'yyyy', placeholder: '2024' },
  { value: '02', label: '월별', format: 'yyyyMM', placeholder: '202401' },
  { value: '03', label: '일별', format: 'yyyyMMdd', placeholder: '20240101' },
];
