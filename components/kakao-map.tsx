'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KakaoMapProps {
  /** 표시할 주소 */
  address: string;
  /** 지도 위에 표시할 이름 (InfoWindow) */
  placeName?: string;
  /** 지도 높이 (CSS 값) */
  height?: string;
}

const getKakaoMapApiKey = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  }
  return undefined;
};

const getKakaoSdkUrl = () => {
  const apiKey = getKakaoMapApiKey();
  if (!apiKey) return '';
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
};

/**
 * 카카오 지도 SDK 스크립트 동적 로드
 * 이미 로드되었으면 즉시 resolve
 */
const loadKakaoMapScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Server-side rendering is not supported'));
      return;
    }

    const apiKey = getKakaoMapApiKey();
    const sdkUrl = getKakaoSdkUrl();

    // API 키 확인
    if (!apiKey || !sdkUrl) {
      console.error('[KakaoMap] API 키 없음:', { apiKey, sdkUrl });
      reject(new Error('NEXT_PUBLIC_KAKAO_MAP_API_KEY is not defined'));
      return;
    }

    console.log('[KakaoMap] SDK URL:', sdkUrl);

    // 이미 로드 완료
    if (window.kakao?.maps?.services) {
      console.log('[KakaoMap] SDK already loaded');
      resolve();
      return;
    }

    // 이미 스크립트 태그가 삽입된 경우
    const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`);
    if (existingScript) {
      console.log('[KakaoMap] Script tag exists, waiting for load...');
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          console.log('[KakaoMap] Existing script loaded');
          resolve();
        });
      } else {
        const handleLoad = () => {
          console.log('[KakaoMap] Script loaded event fired');
          if (window.kakao?.maps) {
            window.kakao.maps.load(() => {
              console.log('[KakaoMap] Maps loaded');
              resolve();
            });
          } else {
            reject(new Error('window.kakao.maps not available after script load'));
          }
        };
        existingScript.addEventListener('load', handleLoad, { once: true });
        existingScript.addEventListener('error', (e) => {
          console.error('[KakaoMap] Existing script error event:', e);
          reject(new Error('Kakao Maps SDK script load error'));
        }, { once: true });
      }
      return;
    }

    // 새 스크립트 태그 생성
    console.log('[KakaoMap] Creating new script tag');
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      console.log('[KakaoMap] Script loaded, initializing maps...');
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          console.log('[KakaoMap] Maps loaded successfully');
          resolve();
        });
      } else {
        console.error('[KakaoMap] window.kakao.maps not found');
        reject(new Error('window.kakao.maps not found after script load'));
      }
    };
    script.onerror = (e) => {
      console.error('[KakaoMap] Script load error event:', e);
      console.error('[KakaoMap] Failed URL:', sdkUrl);
      reject(new Error('Kakao Maps SDK script failed to load - check API key and platform settings'));
    };
    document.head.appendChild(script);
  });
};

/**
 * 카카오 지도 컴포넌트
 * 주소를 Geocoding 하여 해당 위치에 마커와 InfoWindow를 표시
 */
const KakaoMap = ({ address, placeName, height = '300px' }: KakaoMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string>('');
  const [isMapLoading, setIsMapLoading] = useState(true);

  const initializeMap = useCallback(async () => {
    const apiKey = getKakaoMapApiKey();
    
    if (!apiKey) {
      console.error('[KakaoMap] API 키 없음');
      setMapError('카카오 지도 API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_KAKAO_MAP_API_KEY를 설정해주세요.');
      setIsMapLoading(false);
      return;
    }

    console.log('[KakaoMap] API 키 확인 완료 (길이):', apiKey.length);

    if (!mapContainerRef.current) return;

    try {
      console.log('[KakaoMap] SDK 로드 시작...');
      await loadKakaoMapScript();
      console.log('[KakaoMap] SDK 로드 완료');

      const geocoder = new window.kakao.maps.services.Geocoder();
      console.log('[KakaoMap] Geocoder 생성 완료, 주소 검색 시작:', address);

      geocoder.addressSearch(address, (result, status) => {
        console.log('[KakaoMap] Geocoder 결과:', { status, resultLength: result?.length });

        if (!mapContainerRef.current) {
          console.warn('[KakaoMap] mapContainerRef.current가 없음');
          setIsMapLoading(false);
          return;
        }

        try {
          if (status === 'OK' && result && result.length > 0) {
            console.log('[KakaoMap] 주소 찾기 성공:', result[0]);

            const coords = new window.kakao.maps.LatLng(
              parseFloat(result[0].y),
              parseFloat(result[0].x)
            );

            const map = new window.kakao.maps.Map(mapContainerRef.current, {
              center: coords,
              level: 4,
            });

            const marker = new window.kakao.maps.Marker({
              map,
              position: coords,
            });

            if (placeName) {
              const infoContent = `
                <div style="padding:8px 12px;font-size:13px;font-weight:600;white-space:nowrap;">
                  ${placeName}
                </div>
              `;
              const infoWindow = new window.kakao.maps.InfoWindow({
                content: infoContent,
              });
              infoWindow.open(map, marker);
            }

            console.log('[KakaoMap] 지도 렌더링 완료');
            setMapError('');
            setIsMapLoading(false);
          } else {
            console.warn('[KakaoMap] 주소 검색 실패:', status);
            setMapError('주소를 찾을 수 없습니다. 카카오 지도에서 직접 검색해보세요.');
            setIsMapLoading(false);
          }
        } catch (callbackError) {
          console.error('[KakaoMap] Geocoder 콜백 에러:', callbackError);
          setMapError('지도 생성 중 오류가 발생했습니다.');
          setIsMapLoading(false);
        }
      });
    } catch (error) {
      console.error('[KakaoMap] SDK 로드 또는 초기화 에러:', error);
      setMapError('카카오 지도를 불러오는 데 실패했습니다. API 키와 플랫폼 등록을 확인해주세요.');
      setIsMapLoading(false);
    }
  }, [address, placeName]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  if (mapError) {
    return (
      <Alert>
        <AlertDescription className="text-xs">
          {mapError}
          {address && (
            <a
              href={`https://map.kakao.com/?q=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-primary underline underline-offset-2"
              aria-label="카카오맵에서 주소 검색"
            >
              카카오맵에서 보기
            </a>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-md border">
      {isMapLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80"
          style={{ height }}
        >
          <span className="text-sm text-muted-foreground">지도 로딩 중...</span>
        </div>
      )}
      <div ref={mapContainerRef} style={{ width: '100%', height }} />
    </div>
  );
};

export default KakaoMap;
