'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import type { AuctionProperty } from '@/types/auction-detail';

export default function PropertyDetailPage({ 
  params 
}: { 
  params: Promise<{ caseNumber: string }> 
}) {
  const resolvedParams = use(params);
  const [property, setProperty] = useState<AuctionProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPropertyDetail();
  }, [resolvedParams.caseNumber]);

  const fetchPropertyDetail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/auction/detail/${encodeURIComponent(resolvedParams.caseNumber)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || '정보를 불러올 수 없습니다.');
        return;
      }

      const data = await response.json();
      
      if (!data.success || !data.property) {
        setError('물건 정보를 찾을 수 없습니다.');
        return;
      }

      setProperty(data.property);

    } catch (err) {
      console.error('상세 정보 조회 오류:', err);
      setError('상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    const eok = Math.floor(price / 100000000);
    const man = Math.floor((price % 100000000) / 10000);
    return eok > 0 ? `${eok}억 ${man > 0 ? man + '만' : ''}원` : `${man}만원`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">상세 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <span className="text-6xl mb-4 block">⚠️</span>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">오류 발생</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/properties" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6">
          <Link href="/properties" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
            ← 목록으로
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">{property.buildingType} 상세 정보</h1>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📋</span> 기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">사건번호</span>
                  <p className="font-semibold text-gray-800">{property.caseNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">법원</span>
                  <p className="font-semibold text-gray-800">{property.courtName || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-sm text-gray-600">소재지</span>
                  <p className="font-semibold text-gray-800">{property.address}</p>
                </div>
                {property.buildYear && (
                  <div>
                    <span className="text-sm text-gray-600">건축년도</span>
                    <p className="font-semibold text-gray-800">{property.buildYear}년</p>
                  </div>
                )}
                {property.status && (
                  <div>
                    <span className="text-sm text-gray-600">진행상태</span>
                    <p className="font-semibold text-blue-600">{property.status}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Area Info */}
            {(property.area.exclusive || property.area.supply) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📐</span> 면적 정보
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.area.exclusive && (
                    <>
                      <div>
                        <span className="text-sm text-gray-600">전용면적</span>
                        <p className="font-semibold text-gray-800">{property.area.exclusive}㎡</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">전용평수</span>
                        <p className="font-semibold text-gray-800">{property.area.exclusivePyeong}평</p>
                      </div>
                    </>
                  )}
                  {property.area.supply && (
                    <>
                      <div>
                        <span className="text-sm text-gray-600">공급면적</span>
                        <p className="font-semibold text-gray-800">{property.area.supply}㎡</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">공급평수</span>
                        <p className="font-semibold text-gray-800">{property.area.supplyPyeong}평</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Complex Info */}
            {property.complexInfo && (property.complexInfo.name || property.complexInfo.totalUnits) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏢</span> 단지 정보
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.complexInfo.name && (
                    <div>
                      <span className="text-sm text-gray-600">단지명/아파트명</span>
                      <p className="font-semibold text-gray-800">{property.complexInfo.name}</p>
                    </div>
                  )}
                  {property.complexInfo.totalUnits && (
                    <div>
                      <span className="text-sm text-gray-600">총 세대수</span>
                      <p className="font-semibold text-gray-800">{property.complexInfo.totalUnits.toLocaleString()}세대</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Facilities */}
            {property.facilities && property.facilities.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏗️</span> 부대시설
                </h2>
                <div className="flex flex-wrap gap-2">
                  {property.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location Info */}
            {property.location && (property.location.description || property.location.transportation) && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📍</span> 입지 정보
                </h2>
                {property.location.description && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-600">주변 환경</span>
                    <p className="text-gray-800 mt-1">{property.location.description}</p>
                  </div>
                )}
                {property.location.transportation && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">교통 정보</span>
                    <p className="text-gray-800 mt-1">{property.location.transportation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Images */}
            {property.images && property.images.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📷</span> 물건 사진
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`물건 사진 ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Info */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>💰</span> 가격 정보
              </h2>
              <div className="space-y-4">
                {property.appraisalValue && (
                  <div className="pb-4 border-b">
                    <span className="text-sm text-gray-600">감정가</span>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatPrice(property.appraisalValue)}
                    </p>
                  </div>
                )}
                {property.minimumBidPrice && (
                  <div className="pb-4 border-b">
                    <span className="text-sm text-gray-600">최저입찰가</span>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(property.minimumBidPrice)}
                    </p>
                  </div>
                )}
                {property.bidDate && (
                  <div>
                    <span className="text-sm text-gray-600">입찰일시</span>
                    <p className="font-semibold text-gray-800 mt-1">{property.bidDate}</p>
                  </div>
                )}
                {property.biddingCount && (
                  <div>
                    <span className="text-sm text-gray-600">입찰횟수</span>
                    <p className="font-semibold text-gray-800 mt-1">{property.biddingCount}회</p>
                  </div>
                )}
              </div>
              
              {property.url && (
                <a
                  href={property.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  법원경매정보에서 보기 →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
