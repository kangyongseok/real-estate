import puppeteer, { type Page, type Browser } from 'puppeteer';
import type { AuctionProperty, AuctionSearchParams } from '@/types/auction-detail';

// 크롤링된 원시 데이터 타입 (텍스트 형식)
interface RawAuctionProperty {
  caseNumber: string;
  courtName: string;
  buildingType: string;
  address: string;
  appraisalText: string;
  minimumBidText: string;
  bidDateText?: string;
  url: string;
}

// 법원경매정보 사이트 URL
const BASE_URL = 'https://www.courtauction.go.kr';
const SEARCH_URL = `${BASE_URL}/RetrieveRealEstMulDetailList.laf`;

// 재시도 관련 상수
const MAX_RETRIES = 2;
const NAV_TIMEOUT = 60000;
const WAIT_AFTER_LOAD = 3000;

// 지역 코드 매핑
const REGION_CODES: Record<string, string> = {
  '서울': '1',
  '경기': '9',
  '서울특별시': '1',
  '경기도': '9',
  '부산': '2',
  '부산광역시': '2',
  '대구': '3',
  '대구광역시': '3',
  '인천': '4',
  '인천광역시': '4',
  '광주': '5',
  '광주광역시': '5',
  '대전': '6',
  '대전광역시': '6',
  '울산': '7',
  '울산광역시': '7',
};

// 물건 종류 코드
const BUILDING_TYPE_CODES: Record<string, string> = {
  '아파트': '000801',
  '연립다세대': '000802',
  '단독주택': '000803',
  '토지': '00080',
  '상가': '000804',
};

/**
 * Puppeteer 브라우저 인스턴스를 생성
 * @returns Puppeteer 브라우저 인스턴스
 */
const createBrowser = async (): Promise<Browser> => {
  return puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  });
};

/**
 * 페이지 기본 설정 적용
 * @param page - Puppeteer 페이지 인스턴스
 */
const setupPage = async (page: Page): Promise<void> => {
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  });
};

/**
 * 재시도 로직이 포함된 페이지 이동
 * @param page - Puppeteer 페이지 인스턴스
 * @param url - 이동할 URL
 * @param retries - 남은 재시도 횟수
 */
const navigateWithRetry = async (
  page: Page,
  url: string,
  retries: number = MAX_RETRIES
): Promise<void> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`페이지 이동 시도 (${attempt + 1}/${retries + 1}): ${url}`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT,
      });
      await new Promise((resolve) => setTimeout(resolve, WAIT_AFTER_LOAD));
      return;
    } catch (error) {
      console.warn(`페이지 이동 실패 (${attempt + 1}/${retries + 1}):`, error);
      if (attempt === retries) {
        throw error;
      }
      // 재시도 전 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

/**
 * 경매 물건 목록 크롤링
 * @param params - 검색 파라미터
 * @returns 검색 결과 목록과 전체 건수
 */
export async function searchAuctionProperties(
  params: AuctionSearchParams
): Promise<{ properties: AuctionProperty[]; total: number }> {
  const browser = await createBrowser();
  const page = await browser.newPage();
  await setupPage(page);

  try {
    // 1단계: 메인 페이지 먼저 접속하여 세션/쿠키 확보
    await navigateWithRetry(page, BASE_URL);

    // 2단계: 검색 페이지로 이동
    await navigateWithRetry(page, SEARCH_URL);

    // 프레임셋 구조 확인 및 처리
    const hasFrames = await page.evaluate(() => {
      const frames = document.querySelectorAll('frame, iframe');
      return frames.length > 0;
    });

    let targetPage = page;

    if (hasFrames) {
      console.log('프레임 구조 감지, 프레임 내부 접근 시도');
      const frames = page.frames();
      console.log(`프레임 수: ${frames.length}`);

      // 검색 폼이 있는 프레임 찾기
      for (const frame of frames) {
        try {
          const hasForm = await frame.evaluate(() => {
            return !!document.querySelector('form, select, input[type="text"]');
          });
          if (hasForm) {
            console.log(`검색 폼이 있는 프레임 발견: ${frame.url()}`);
            break;
          }
        } catch {
          continue;
        }
      }
    }

    // 디버깅: 페이지 상태 확인
    const pageState = await targetPage.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      formCount: document.querySelectorAll('form').length,
      selectCount: document.querySelectorAll('select').length,
      bodyLength: document.body?.innerHTML?.length || 0,
    }));
    console.log('페이지 상태:', JSON.stringify(pageState));

    // 검색 폼 필드 찾기 및 입력
    const formElements = await targetPage.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select')).map(
        (s) => ({
          name: (s as HTMLSelectElement).name,
          id: (s as HTMLSelectElement).id,
          optionCount: (s as HTMLSelectElement).options.length,
          options: Array.from((s as HTMLSelectElement).options)
            .slice(0, 5)
            .map((o) => ({ value: o.value, text: o.text })),
        })
      );
      const buttons = Array.from(
        document.querySelectorAll(
          'button, input[type="submit"], input[type="button"], a.btn, a[onclick]'
        )
      ).map((b) => ({
        tag: b.tagName,
        text: (b as HTMLElement).textContent?.trim() || '',
        id: (b as HTMLElement).id,
        value: (b as HTMLInputElement).value || '',
        onclick: (b as HTMLElement).getAttribute('onclick') || '',
      }));
      return { selects, buttons };
    });
    console.log('폼 요소:', JSON.stringify(formElements, null, 2));

    // 지역 선택
    if (params.region && REGION_CODES[params.region]) {
      const regionCode = REGION_CODES[params.region];
      const sidoSelect = formElements.selects.find(
        (s) =>
          s.name?.toLowerCase().includes('sido') ||
          s.id?.toLowerCase().includes('sido') ||
          s.name?.includes('sd') ||
          s.name?.includes('jiwon')
      );

      if (sidoSelect) {
        const selector = sidoSelect.name
          ? `select[name="${sidoSelect.name}"]`
          : `#${sidoSelect.id}`;
        console.log(`지역 선택: ${selector} = ${regionCode}`);
        await targetPage.select(selector, regionCode);
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        console.warn('지역 셀렉터를 찾지 못했습니다. 사용 가능한 셀렉트:', formElements.selects);
      }
    }

    // 물건종류 선택
    if (params.buildingType && BUILDING_TYPE_CODES[params.buildingType]) {
      const buildingCode = BUILDING_TYPE_CODES[params.buildingType];
      try {
        // 체크박스 또는 셀렉트 방식 모두 시도
        const clicked = await targetPage.evaluate((code) => {
          const checkbox = document.querySelector(
            `input[value="${code}"], input[value*="${code}"]`
          ) as HTMLInputElement;
          if (checkbox) {
            checkbox.click();
            return true;
          }
          return false;
        }, buildingCode);

        if (!clicked) {
          console.warn(`물건 종류 입력 실패: ${params.buildingType} (${buildingCode})`);
        }
      } catch {
        console.warn(`물건 종류 처리 오류: ${params.buildingType}`);
      }
    }

    // 검색 버튼 클릭
    try {
      const isClicked = await targetPage.evaluate(() => {
        // 검색/조회 버튼을 찾아서 클릭
        const candidates = Array.from(
          document.querySelectorAll(
            'button, input[type="submit"], input[type="button"], a'
          )
        );

        for (const el of candidates) {
          const text = (el as HTMLElement).textContent?.trim() || '';
          const value = (el as HTMLInputElement).value || '';
          const onclick = (el as HTMLElement).getAttribute('onclick') || '';

          if (
            text.includes('검색') ||
            value.includes('검색') ||
            text.includes('조회') ||
            value.includes('조회') ||
            onclick.includes('search') ||
            onclick.includes('Search')
          ) {
            (el as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (isClicked) {
        console.log('검색 버튼 클릭 완료');
        // 결과 로딩 대기
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.warn('검색 버튼을 찾지 못했습니다');
      }
    } catch (error) {
      console.error('검색 실행 오류:', error);
    }

    // 결과 파싱
    const properties: RawAuctionProperty[] = await targetPage.evaluate(
      (baseUrl) => {
        const tableSelectors = [
          'table.Ltbl_list tbody tr',
          'table.Ltbl tbody tr',
          'table.result tbody tr',
          'table.list tbody tr',
          '#contents table tbody tr',
          'table tbody tr',
        ];

        let rows: NodeListOf<Element> | null = null;
        for (const selector of tableSelectors) {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            rows = found;
            break;
          }
        }

        if (!rows || rows.length === 0) return [];

        const results: any[] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;

          // 사건번호 패턴: XXXX타경XXXXX
          let caseNumber = '';
          let caseIdx = -1;

          for (let i = 0; i < Math.min(cells.length, 6); i++) {
            const link = cells[i].querySelector('a');
            const text = (link || cells[i]).textContent?.trim() || '';
            if (text.match(/\d{4}타경\d+/)) {
              caseNumber = text.match(/\d{4}타경\d+/)?.[0] || '';
              caseIdx = i;
              break;
            }
          }

          if (!caseNumber) return;

          const courtName =
            cells[Math.max(0, caseIdx - 1)]?.textContent?.trim() || '';
          const buildingType =
            cells[caseIdx + 1]?.textContent?.trim() || '';
          const address =
            cells[caseIdx + 2]?.textContent?.trim() || '';
          const appraisalText =
            cells[caseIdx + 3]?.textContent?.trim() || '';
          const minimumBidText =
            cells[caseIdx + 4]?.textContent?.trim() || '';
          const bidDateText =
            cells[caseIdx + 5]?.textContent?.trim() || '';

          results.push({
            caseNumber,
            courtName,
            buildingType,
            address,
            appraisalText,
            minimumBidText,
            bidDateText,
            url: `${baseUrl}/RetrieveRealEstDetailInqSvl.laf?saNo=${encodeURIComponent(caseNumber)}`,
          });
        });

        return results;
      },
      BASE_URL
    );

    // 가격 문자열을 숫자로 파싱
    const parsedProperties: AuctionProperty[] = properties.map((prop) => ({
      ...prop,
      appraisalValue: parsePrice(prop.appraisalText),
      minimumBidPrice: parsePrice(prop.minimumBidText),
      area: {},
    }));

    // 전체 건수 추출
    const totalText = await targetPage.evaluate(() => {
      const candidates = [
        '.total_num',
        '.result_count',
        '#contents .count',
        'span.txt_bold',
      ];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el?.textContent) return el.textContent;
      }
      // 텍스트에서 "총 N건" 패턴 찾기
      const bodyText = document.body?.textContent || '';
      const match = bodyText.match(/총\s*(\d[\d,]*)\s*건/);
      return match ? match[1] : '';
    });
    const total = totalText
      ? parseInt(totalText.replace(/[^\d]/g, '')) || 0
      : parsedProperties.length;

    await browser.close();

    return { properties: parsedProperties, total };
  } catch (error) {
    console.error('크롤링 오류:', error);

    // 오류 시 스크린샷 저장 (디버깅용)
    try {
      await page.screenshot({
        path: '/tmp/courtauction-error.png',
        fullPage: true,
      });
      console.log('오류 스크린샷 저장: /tmp/courtauction-error.png');
    } catch {}

    await browser.close();
    throw error instanceof Error
      ? error
      : new Error('경매 정보를 가져오는데 실패했습니다.');
  }
}

/**
 * 경매 물건 상세 정보 크롤링
 * @param caseNumber - 사건번호
 * @returns 경매 물건 상세 정보
 */
export async function getAuctionPropertyDetail(
  caseNumber: string
): Promise<AuctionProperty | null> {
  const browser = await createBrowser();
  const page = await browser.newPage();
  await setupPage(page);

  try {
    // 상세 페이지로 이동
    const detailUrl = `${BASE_URL}/RetrieveRealEstDetailInqSvl.laf?saNo=${encodeURIComponent(caseNumber)}`;
    await navigateWithRetry(page, detailUrl);

    // 기본 정보 추출
    const property: AuctionProperty = {
      caseNumber,
      courtName: await extractText(page, '.court_name, th:has-text("법원") + td'),
      buildingType: await extractText(page, '.building_type, th:has-text("물건종류") + td'),
      address: await extractText(page, '.address, th:has-text("소재지") + td'),
      area: {},
    };

    // 건축년도 추출
    const buildYearText = await extractText(page, 'th:has-text("건축년도") + td, th:has-text("준공") + td');
    property.buildYear = buildYearText.replace(/\D/g, '');

    // 면적 추출
    const areaText = await extractText(page, 'th:has-text("전용면적") + td, th:has-text("면적") + td');
    const areaMatch = areaText.match(/(\d+\.?\d*)/);
    if (areaMatch) {
      const areaInM2 = parseFloat(areaMatch[1]);
      property.area = {
        exclusive: areaInM2,
        exclusivePyeong: Math.round(areaInM2 * 0.3025 * 100) / 100,
      };
    }

    // 감정가, 최저가 추출
    const appraisalText = await extractText(page, 'th:has-text("감정가") + td');
    property.appraisalValue = parsePrice(appraisalText);

    const minimumBidText = await extractText(page, 'th:has-text("최저가") + td, th:has-text("최저입찰가") + td');
    property.minimumBidPrice = parsePrice(minimumBidText);

    // 입찰일시 추출
    property.bidDate = await extractText(page, 'th:has-text("입찰일시") + td, th:has-text("매각기일") + td');

    // 단지정보 추출 (아파트인 경우)
    if (property.buildingType?.includes('아파트')) {
      const complexName = await extractText(page, 'th:has-text("단지명") + td, th:has-text("아파트명") + td');
      const totalUnitsText = await extractText(page, 'th:has-text("세대수") + td, th:has-text("총세대") + td');
      
      property.complexInfo = {
        name: complexName || undefined,
        totalUnits: totalUnitsText ? parseInt(totalUnitsText.replace(/\D/g, '')) : undefined,
      };
    }

    // 부대시설 추출
    const facilitiesText = await extractText(page, 'th:has-text("부대시설") + td, th:has-text("시설") + td');
    if (facilitiesText) {
      property.facilities = facilitiesText.split(/[,、·]/).map(f => f.trim()).filter(f => f);
    }

    // 입지 및 교통 정보 추출
    const locationText = await extractText(page, 'th:has-text("입지") + td, th:has-text("위치") + td');
    const transportText = await extractText(page, 'th:has-text("교통") + td');
    
    if (locationText || transportText) {
      property.location = {
        description: locationText || undefined,
        transportation: transportText || undefined,
      };
    }

    // 이미지 추출
    const images = await page.$$eval('img.property_img, .img_area img', (imgs: any) =>
      imgs.map((img: any) => img.src).filter((src: any) => src && !src.includes('no_image'))
    );
    property.images = images.length > 0 ? images : undefined;

    // 진행상태 추출
    property.status = await extractText(page, 'th:has-text("진행상태") + td, .status');

    // 입찰횟수 추출
    const biddingCountText = await extractText(page, 'th:has-text("입찰횟수") + td, th:has-text("회차") + td');
    property.biddingCount = biddingCountText ? parseInt(biddingCountText.replace(/\D/g, '')) : undefined;

    await browser.close();

    return property;

  } catch (error) {
    console.error('상세 정보 크롤링 오류:', error);
    await browser.close();
    return null;
  }
}

/**
 * 텍스트 추출 헬퍼 함수
 */
async function extractText(page: any, ...selectors: string[]): Promise<string> {
  for (const selector of selectors) {
    try {
      const text = await page.$eval(selector, (el: any) => el.textContent?.trim() || '');
      if (text) {
        return text;
      }
    } catch {
      continue;
    }
  }
  return '';
}

/**
 * 가격 문자열을 숫자로 변환
 */
function parsePrice(priceText: string): number | undefined {
  if (!priceText) return undefined;
  
  // 억, 만 단위 처리
  const match = priceText.match(/(\d+\.?\d*)\s*억?\s*(\d+\.?\d*)?\s*만?/);
  if (match) {
    const eok = parseFloat(match[1]) * 100000000;
    const man = match[2] ? parseFloat(match[2]) * 10000 : 0;
    return eok + man;
  }

  // 일반 숫자 처리
  const numbers = priceText.replace(/[^\d]/g, '');
  return numbers ? parseInt(numbers) : undefined;
}
