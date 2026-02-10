'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import KakaoMap from '@/components/kakao-map';
import type { SubscriptionFormData, SubscriptionNoticeData } from '@/types/auction';

registerLocale('ko', ko);

const HOUSE_TYPES = [
  { value: '', label: '전체' },
  { value: '01', label: 'APT' },
  { value: '09', label: '민간사전청약' },
  { value: '10', label: '신혼희망타운' },
];

const REGIONS = [
  { value: '', label: '전체' },
  { value: '11', label: '서울' },
  { value: '26', label: '부산' },
  { value: '27', label: '대구' },
  { value: '28', label: '인천' },
  { value: '29', label: '광주' },
  { value: '30', label: '대전' },
  { value: '31', label: '울산' },
  { value: '36', label: '세종' },
  { value: '41', label: '경기' },
  { value: '42', label: '강원' },
  { value: '43', label: '충북' },
  { value: '44', label: '충남' },
  { value: '45', label: '전북' },
  { value: '46', label: '전남' },
  { value: '47', label: '경북' },
  { value: '48', label: '경남' },
  { value: '50', label: '제주' },
];

const formatDateForApi = (date: Date | null): string => {
  if (!date) return '';
  return dayjs(date).format('YYYYMM');
};

const getDefaultDates = () => {
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  return { start: threeMonthsAgo, end: today };
};

export default function SubscriptionPage() {
  const defaultDates = getDefaultDates();

  const [formData, setFormData] = useState<SubscriptionFormData>({
    startDate: formatDateForApi(defaultDates.start),
    endDate: formatDateForApi(defaultDates.end),
    region: '',
    houseType: '',
    page: 1,
    pageSize: 10,
  });

  const [startDateObj, setStartDateObj] = useState<Date | null>(defaultDates.start);
  const [endDateObj, setEndDateObj] = useState<Date | null>(defaultDates.end);
  const [results, setResults] = useState<SubscriptionNoticeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [openMapIndex, setOpenMapIndex] = useState<number | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof SubscriptionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDateObj(date);
    setFormData((prev) => ({ ...prev, startDate: formatDateForApi(date) }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDateObj(date);
    setFormData((prev) => ({ ...prev, endDate: formatDateForApi(date) }));
  };

  const handleSearch = async (page: number = 1, isNewSearch: boolean = true) => {
    if (!formData.startDate || !formData.endDate) {
      setError('검색 기간을 선택해주세요.');
      return;
    }
    if (formData.startDate > formData.endDate) {
      setError('시작 날짜가 종료 날짜보다 늦을 수 없습니다.');
      return;
    }

    if (isNewSearch) {
      setError('');
      setMessage('');
      setResults([]);
      setCurrentPage(1);
      setHasMore(true);
      setOpenMapIndex(null);
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        numOfRows: String(formData.pageSize),
        pageNo: String(page),
        startmonth: formData.startDate,
        endmonth: formData.endDate,
      });
      if (formData.region) params.append('region', formData.region);
      if (formData.houseType) params.append('houseSecd', formData.houseType);

      const response = await fetch(`/api/subscription?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `서버 오류 (${response.status})`);
        return;
      }

      const data = await response.json();
      if (!data.data || !Array.isArray(data.data)) {
        setError('응답 데이터 형식이 올바르지 않습니다.');
        return;
      }

      if (isNewSearch) {
        setResults(data.data);
        setTotalCount(data.totalCount || 0);
        if (data.data.length === 0) {
          setMessage('검색 조건에 맞는 결과가 없습니다.');
          setHasMore(false);
        }
      } else {
        setResults((prev) => [...prev, ...data.data]);
      }

      setMessage(data.message || '');
      
      // 더 이상 데이터가 없는지 확인
      const loadedCount = isNewSearch ? data.data.length : results.length + data.data.length;
      if (loadedCount >= (data.totalCount || 0) || data.data.length === 0) {
        setHasMore(false);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('서버에 연결할 수 없습니다.');
      } else {
        setError(`검색 중 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      handleSearch(nextPage, false);
    }
  }, [isLoading, hasMore, currentPage, formData]);

  const handleNoticeClick = (url: string | undefined) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleMap = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenMapIndex(openMapIndex === index ? null : index);
  };

  const handleMapKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      setOpenMapIndex(openMapIndex === index ? null : index);
    }
  };

  const getRecruitmentStatus = (item: SubscriptionNoticeData) => {
    const today = dayjs();
    
    // 청약접수기간이 있으면 우선 사용
    const startDate = item.SUBSCRPT_RCEPT_BGNDE ? dayjs(item.SUBSCRPT_RCEPT_BGNDE) : null;
    const endDate = item.SUBSCRPT_RCEPT_ENDDE ? dayjs(item.SUBSCRPT_RCEPT_ENDDE) : null;

    if (startDate && endDate) {
      if (today.isBefore(startDate, 'day')) {
        return { status: '청약예정', variant: 'default' as const };
      }
      if (today.isAfter(endDate, 'day')) {
        return { status: '청약마감', variant: 'outline' as const };
      }
      return { status: '청약진행중', variant: 'default' as const, isActive: true };
    }

    // 청약접수기간이 없으면 모집공고일로 판단
    const noticeDate = item.RCRIT_PBLANC_DE ? dayjs(item.RCRIT_PBLANC_DE) : null;
    if (!noticeDate) {
      return { status: '일자미정', variant: 'secondary' as const };
    }

    // 모집공고일 기준 (공고일로부터 일정 기간 경과 여부로 판단)
    const daysSinceNotice = today.diff(noticeDate, 'day');
    
    if (daysSinceNotice < 0) {
      return { status: '공고예정', variant: 'default' as const };
    }
    
    if (daysSinceNotice <= 30) {
      // 공고 후 30일 이내는 진행중으로 간주
      return { status: '공고진행중', variant: 'default' as const, isActive: true };
    }
    
    return { status: '공고완료', variant: 'outline' as const };
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="container py-6 md:py-10 space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">청약홈 분양정보 조회</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          한국부동산원 청약홈의 APT, 민간사전청약, 신혼희망타운 등 분양정보를 검색할 수 있습니다.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">검색 조건</CardTitle>
          <CardDescription>기간과 필터를 선택한 후 검색하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>검색 시작월 <span className="text-destructive">*</span></Label>
              <DatePicker
                selected={startDateObj}
                onChange={handleStartDateChange}
                dateFormat="yyyy년 MM월"
                showMonthYearPicker
                placeholderText="시작월 선택"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                maxDate={new Date()}
                locale="ko"
                showPopperArrow={false}
              />
            </div>
            <div className="space-y-2">
              <Label>검색 종료월 <span className="text-destructive">*</span></Label>
              <DatePicker
                selected={endDateObj}
                onChange={handleEndDateChange}
                dateFormat="yyyy년 MM월"
                showMonthYearPicker
                placeholderText="종료월 선택"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                minDate={startDateObj ?? undefined}
                locale="ko"
                showPopperArrow={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">지역</Label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="houseType">주택구분</Label>
              <select
                id="houseType"
                value={formData.houseType}
                onChange={(e) => handleInputChange('houseType', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {HOUSE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={() => handleSearch(1)} disabled={isLoading} className="w-full">
            {isLoading ? '검색 중...' : '검색하기'}
          </Button>
        </CardContent>
      </Card>

      {/* Error / Info */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && !error && (
        <Alert>
          <AlertTitle>안내</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">검색 결과</CardTitle>
              <Badge variant="secondary">총 {totalCount.toLocaleString()}건</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border p-4 transition-colors"
              >
                {/* Clickable Header */}
                <div
                  onClick={() => handleNoticeClick(item.PBLANC_URL)}
                  className="cursor-pointer hover:opacity-80"
                  role="link"
                  tabIndex={0}
                  aria-label={`${item.HOUSE_NM} 상세보기`}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleNoticeClick(item.PBLANC_URL); }}
                >
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm leading-snug">{item.HOUSE_NM}</h3>
                      <span className="text-xs text-primary shrink-0 ml-2">상세보기 →</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.HSSPLY_ADRES}</p>
                  </div>
                </div>

                {/* Badges & Info */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {(() => {
                    const statusInfo = getRecruitmentStatus(item);
                    return (
                      <Badge 
                        variant={statusInfo.variant}
                        className={statusInfo.isActive ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                      >
                        {statusInfo.status}
                      </Badge>
                    );
                  })()}
                  {item.SUBSCRPT_AREA_CODE_NM && (
                    <Badge variant="outline">{item.SUBSCRPT_AREA_CODE_NM}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-2 border-t">
                  <div>
                    <span className="text-muted-foreground">공급 세대수</span>
                    <p className="font-medium">{parseInt(item.TOT_SUPLY_HSHLDCO || '0').toLocaleString()}세대</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">모집공고일</span>
                    <p className="font-medium">{item.RCRIT_PBLANC_DE}</p>
                  </div>
                  {item.SUBSCRPT_RCEPT_BGNDE && item.SUBSCRPT_RCEPT_ENDDE && (
                    <div className={getRecruitmentStatus(item).isActive ? 'col-span-2' : ''}>
                      <span className="text-muted-foreground">청약접수기간</span>
                      <p className={cn(
                        "font-medium",
                        getRecruitmentStatus(item).isActive && "text-green-600 font-semibold"
                      )}>
                        {item.SUBSCRPT_RCEPT_BGNDE} ~ {item.SUBSCRPT_RCEPT_ENDDE}
                      </p>
                    </div>
                  )}
                  {item.PRZWNER_PRESNATN_DE && (
                    <div>
                      <span className="text-muted-foreground">당첨자발표일</span>
                      <p className="font-medium">{item.PRZWNER_PRESNATN_DE}</p>
                    </div>
                  )}
                  {item.MDHS_TELNO && (
                    <div>
                      <span className="text-muted-foreground">문의전화</span>
                      <p className="font-medium">{item.MDHS_TELNO}</p>
                    </div>
                  )}
                </div>

                {/* Map Toggle Button */}
                {item.HSSPLY_ADRES && (
                  <div className="pt-3 mt-3 border-t">
                    <Button
                      variant={openMapIndex === index ? 'default' : 'outline'}
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={(e) => handleToggleMap(e, index)}
                      onKeyDown={(e) => handleMapKeyDown(e, index)}
                      aria-expanded={openMapIndex === index}
                      aria-label={`${item.HOUSE_NM} 지도 ${openMapIndex === index ? '닫기' : '보기'}`}
                    >
                      <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {openMapIndex === index ? '지도 닫기' : '지도 보기'}
                    </Button>

                    {/* Inline Map */}
                    {openMapIndex === index && (
                      <div className="mt-3 space-y-2">
                        <KakaoMap
                          address={item.HSSPLY_ADRES}
                          placeName={item.HOUSE_NM}
                          height="280px"
                        />
                        <a
                          href={`https://map.kakao.com/?q=${encodeURIComponent(item.HSSPLY_ADRES)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="카카오맵에서 크게 보기"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          카카오맵에서 크게 보기
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Infinite Scroll Trigger */}
            <div ref={observerTarget} className="h-4" />
            
            {/* Loading Indicator */}
            {isLoading && results.length > 0 && (
              <div className="flex justify-center items-center py-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>더 불러오는 중...</span>
                </div>
              </div>
            )}
            
            {/* End of Results */}
            {!hasMore && results.length > 0 && (
              <div className="flex justify-center items-center py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  모든 결과를 불러왔습니다 ({results.length}건)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
