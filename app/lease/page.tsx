'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { LeaseFormData, LeaseNoticeData } from '@/types/auction';

registerLocale('ko', ko);

const NOTICE_TYPES = [
  { value: '', label: '전체' },
  { value: '01', label: '토지' },
  { value: '05', label: '분양주택' },
  { value: '06', label: '임대주택' },
  { value: '13', label: '주거복지' },
  { value: '22', label: '상가' },
  { value: '39', label: '신혼희망타운' },
];

const REGIONS = [
  { value: '', label: '전체' },
  { value: '11', label: '서울특별시' },
  { value: '26', label: '부산광역시' },
  { value: '27', label: '대구광역시' },
  { value: '28', label: '인천광역시' },
  { value: '29', label: '광주광역시' },
  { value: '30', label: '대전광역시' },
  { value: '31', label: '울산광역시' },
  { value: '36110', label: '세종특별자치시' },
  { value: '41', label: '경기도' },
  { value: '42', label: '강원도' },
  { value: '43', label: '충청북도' },
  { value: '44', label: '충청남도' },
  { value: '52', label: '전북특별자치도' },
  { value: '46', label: '전라남도' },
  { value: '47', label: '경상북도' },
  { value: '48', label: '경상남도' },
  { value: '50', label: '제주특별자치도' },
];

const NOTICE_STATUS = [
  { value: '', label: '전체' },
  { value: '공고중', label: '공고중' },
  { value: '접수중', label: '접수중' },
  { value: '접수마감', label: '접수마감' },
  { value: '상담요청', label: '상담요청' },
  { value: '정정공고중', label: '정정공고중' },
];

const formatDateForApi = (date: Date | null): string => {
  if (!date) return '';
  return dayjs(date).format('YYYY.MM.DD');
};

const getDefaultDates = () => {
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  return { start: threeMonthsAgo, end: today };
};

export default function LeasePage() {
  const defaultDates = getDefaultDates();

  const [formData, setFormData] = useState<LeaseFormData>({
    startDate: formatDateForApi(defaultDates.start),
    endDate: formatDateForApi(defaultDates.end),
    searchKeyword: '',
    noticeType: '',
    region: '',
    noticeStatus: '',
    page: 1,
    pageSize: 10,
  });

  const [startDateObj, setStartDateObj] = useState<Date | null>(defaultDates.start);
  const [endDateObj, setEndDateObj] = useState<Date | null>(defaultDates.end);
  const [results, setResults] = useState<LeaseNoticeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof LeaseFormData, value: string | number) => {
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
      setError('공고게시일과 공고마감일을 선택해주세요.');
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
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        PG_SZ: String(formData.pageSize),
        PAGE: String(page),
        PAN_NT_ST_DT: formData.startDate,
        CLSG_DT: formData.endDate,
      });
      if (formData.searchKeyword) params.append('PAN_NM', formData.searchKeyword);
      if (formData.noticeType) params.append('UPP_AIS_TP_CD', formData.noticeType);
      if (formData.region) params.append('CNP_CD', formData.region);
      if (formData.noticeStatus) params.append('PAN_SS', formData.noticeStatus);

      const response = await fetch(`/api/lease?${params.toString()}`);
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

  const handleNoticeClick = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
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

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === '공고중' || status === '접수중') return 'default';
    if (status === '접수마감') return 'secondary';
    return 'outline';
  };

  return (
    <div className="container py-6 md:py-10 space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">LH 분양·임대 공고</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          한국토지주택공사(LH)의 분양 및 임대 주택 공고 정보를 검색할 수 있습니다.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">검색 조건</CardTitle>
          <CardDescription>공고 기간과 필터를 선택한 후 검색하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>공고게시일 <span className="text-destructive">*</span></Label>
              <DatePicker
                selected={startDateObj}
                onChange={handleStartDateChange}
                dateFormat="yyyy.MM.dd"
                placeholderText="시작일 선택"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                maxDate={new Date()}
                locale="ko"
                showPopperArrow={false}
              />
            </div>
            <div className="space-y-2">
              <Label>공고마감일 <span className="text-destructive">*</span></Label>
              <DatePicker
                selected={endDateObj}
                onChange={handleEndDateChange}
                dateFormat="yyyy.MM.dd"
                placeholderText="종료일 선택"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                minDate={startDateObj ?? undefined}
                locale="ko"
                showPopperArrow={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="searchKeyword">공고명 검색</Label>
              <Input
                id="searchKeyword"
                value={formData.searchKeyword}
                onChange={(e) => handleInputChange('searchKeyword', e.target.value)}
                placeholder="예: 행복주택, 대전"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noticeType">공고유형</Label>
              <select
                id="noticeType"
                value={formData.noticeType}
                onChange={(e) => handleInputChange('noticeType', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {NOTICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
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
              <Label htmlFor="noticeStatus">공고상태</Label>
              <select
                id="noticeStatus"
                value={formData.noticeStatus}
                onChange={(e) => handleInputChange('noticeStatus', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {NOTICE_STATUS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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
                onClick={() => handleNoticeClick(item.DTL_URL)}
                className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${item.PAN_NM} 상세보기`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNoticeClick(item.DTL_URL); }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Badge variant="outline">{item.UPP_AIS_TP_NM}</Badge>
                      {item.AIS_TP_CD_NM && <Badge variant="outline">{item.AIS_TP_CD_NM}</Badge>}
                      <Badge variant={getStatusVariant(item.PAN_SS)}>{item.PAN_SS}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug truncate">{item.PAN_NM}</h3>
                  </div>
                  <span className="text-xs text-primary shrink-0">상세보기 →</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{item.CNP_CD_NM}</span>
                  {item.PAN_NT_ST_DT && <span>{item.PAN_NT_ST_DT}</span>}
                </div>
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
