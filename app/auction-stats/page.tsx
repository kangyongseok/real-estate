'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { REGIONS, REAL_ESTATE_TYPES, PERIOD_TYPES } from '@/constants/regions';
import type { SearchFormData, AuctionData, SearchPeriodType, RealEstateType } from '@/types/auction';

registerLocale('ko', ko);

export default function Home() {
  const [formData, setFormData] = useState<SearchFormData>({
    periodType: '03',
    startDate: '',
    endDate: '',
    city: 'all',
    district: 'all',
    realEstateType: 'all',
  });

  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [results, setResults] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const selectedCity = REGIONS.find((region) => region.code === formData.city);
  const districts = selectedCity?.districts || [];

  const handleInputChange = (field: keyof SearchFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'city') newData.district = 'all';
      if (field === 'periodType') {
        newData.startDate = '';
        newData.endDate = '';
        setStartDateObj(null);
        setEndDateObj(null);
      }
      return newData;
    });
  };

  const formatDateForApi = (date: Date | null): string => {
    if (!date) return '';
    const d = dayjs(date);
    switch (formData.periodType) {
      case '01': return d.format('YYYY');
      case '02': return d.format('YYYYMM');
      case '03': return d.format('YYYYMMDD');
      default: return '';
    }
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDateObj(date);
    setFormData((prev) => ({ ...prev, startDate: formatDateForApi(date) }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDateObj(date);
    setFormData((prev) => ({ ...prev, endDate: formatDateForApi(date) }));
  };

  const handleSearch = async () => {
    setError('');
    setMessage('');
    setResults([]);
    setExpandedRow(null);

    if (!formData.startDate || !formData.endDate) {
      setError('검색 기간을 선택해주세요.');
      return;
    }
    if (formData.startDate > formData.endDate) {
      setError('시작 날짜가 종료 날짜보다 늦을 수 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search_type_api: formData.periodType,
        search_start_date_api: formData.startDate,
        search_end_date_api: formData.endDate,
      });
      if (formData.city !== 'all') params.append('search_regn1_name_api', formData.city);
      if (formData.district !== 'all') params.append('search_regn2_name_api', formData.district);
      if (formData.realEstateType !== 'all') params.append('search_real_cls_api', formData.realEstateType);

      const response = await fetch(`/api/auction?${params.toString()}`);
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

      setResults(data.data);
      setMessage(data.message || '');
      setTotalCount(data.totalCount || 0);
      if (data.data.length === 0) setMessage('검색 조건에 맞는 결과가 없습니다.');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError(`검색 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  const getCurrentPeriodFormat = () => {
    const period = PERIOD_TYPES.find((p) => p.value === formData.periodType);
    return period?.placeholder || '';
  };

  return (
    <div className="container py-6 md:py-10 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">경매 통계 조회</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          서울 및 경기 지역의 강제경매개시결정등기 신청 부동산 현황을 검색할 수 있습니다.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">검색 조건</CardTitle>
          <CardDescription>기간, 지역, 부동산 구분을 선택한 후 검색하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Type */}
          <div className="space-y-2">
            <Label>검색 기간 타입</Label>
            <div className="flex gap-4">
              {PERIOD_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="periodType"
                    value={type.value}
                    checked={formData.periodType === type.value}
                    onChange={(e) => handleInputChange('periodType', e.target.value as SearchPeriodType)}
                    className="h-4 w-4 text-primary"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>시작 기간</Label>
              <DatePicker
                selected={startDateObj}
                onChange={handleStartDateChange}
                dateFormat={
                  formData.periodType === '01' ? 'yyyy년'
                    : formData.periodType === '02' ? 'yyyy년 MM월'
                    : 'yyyy년 MM월 dd일'
                }
                showYearPicker={formData.periodType === '01'}
                showMonthYearPicker={formData.periodType === '02'}
                placeholderText={getCurrentPeriodFormat()}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                maxDate={new Date()}
                locale="ko"
                showPopperArrow={false}
              />
            </div>
            <div className="space-y-2">
              <Label>종료 기간</Label>
              <DatePicker
                selected={endDateObj}
                onChange={handleEndDateChange}
                dateFormat={
                  formData.periodType === '01' ? 'yyyy년'
                    : formData.periodType === '02' ? 'yyyy년 MM월'
                    : 'yyyy년 MM월 dd일'
                }
                showYearPicker={formData.periodType === '01'}
                showMonthYearPicker={formData.periodType === '02'}
                placeholderText={getCurrentPeriodFormat()}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                minDate={startDateObj ?? undefined}
                maxDate={new Date()}
                locale="ko"
                showPopperArrow={false}
              />
            </div>
          </div>

          {/* Region Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">시도</Label>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="all">전체</option>
                {REGIONS.map((region) => (
                  <option key={region.code} value={region.code}>{region.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">시군구</Label>
              <select
                id="district"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                disabled={formData.city === 'all' || districts.length === 0}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">전체</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>{district.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Real Estate Type */}
          <div className="space-y-2">
            <Label>부동산 구분</Label>
            <div className="flex gap-4 flex-wrap">
              {REAL_ESTATE_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="realEstateType"
                    value={type.value}
                    checked={formData.realEstateType === type.value}
                    onChange={(e) => handleInputChange('realEstateType', e.target.value as RealEstateType)}
                    className="h-4 w-4 text-primary"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading ? '검색 중...' : '검색'}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info */}
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>일자</TableHead>
                  <TableHead>시도</TableHead>
                  <TableHead>시군구</TableHead>
                  <TableHead className="text-right">건수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item, index) => (
                  <React.Fragment key={index}>
                    <TableRow
                      onClick={() => handleRowClick(index)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium">
                        <span className={`inline-block mr-2 text-xs transition-transform duration-200 ${expandedRow === index ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        {item.resDate}
                      </TableCell>
                      <TableCell>{item.adminRegn1Name}</TableCell>
                      <TableCell>{item.adminRegn2Name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {parseInt(item.tot).toLocaleString()}건
                      </TableCell>
                    </TableRow>
                    {expandedRow === index && (
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={4}>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">조회 일자</span>
                              <p className="font-medium">{item.resDate}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">경매 건수</span>
                              <p className="font-medium text-primary">{parseInt(item.tot).toLocaleString()}건</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">시도</span>
                              <p className="font-medium">{item.adminRegn1Name || '전체'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">시군구</span>
                              <p className="font-medium">{item.adminRegn2Name || '전체'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">검색 기간 타입</span>
                              <p className="font-medium">{PERIOD_TYPES.find((p) => p.value === formData.periodType)?.label}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
