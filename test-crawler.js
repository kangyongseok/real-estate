const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

  try {
    console.log('페이지 이동 중...');
    await page.goto('https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ151F00.xml', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // iframe 확인 및 전환
    const frameInfo = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      return iframes.map(f => ({
        name: f.name,
        id: f.id,
        src: f.src
      }));
    });
    console.log('iframes:', frameInfo);

    // iframe이 있으면 그 안으로 들어가기
    const frames = page.frames();
    console.log('Total frames:', frames.length);
    
    let targetFrame = page.mainFrame();
    if (frames.length > 1) {
      // 두 번째 프레임 시도
      targetFrame = frames[1];
      console.log('Using frame:', targetFrame.url());
    }

    // HTML 구조 확인
    const pageInfo = await targetFrame.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name,
        id: s.id,
        className: s.className,
        options: Array.from(s.options).slice(0, 5).map(o => o.text)
      }));
      
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
        name: i.name,
        id: i.id,
        type: i.type,
        value: i.value,
        className: i.className
      }));
      
      const frames = Array.from(document.querySelectorAll('frame, iframe')).map(f => ({
        name: f.name,
        id: f.id,
        src: f.src
      }));

      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).map(b => ({
        text: b.textContent?.trim() || b.value,
        id: b.id,
        className: b.className
      }));
      
      return { 
        selects: selects.slice(0, 10),
        inputs: inputs.slice(0, 20),
        frames,
        buttons,
        url: window.location.href,
        title: document.title,
        hasFrameset: !!document.querySelector('frameset')
      };
    });
    
    console.log('=== 페이지 정보 ===');
    console.log(JSON.stringify(pageInfo, null, 2));

    // 스크린샷 저장
    await page.screenshot({ path: '/tmp/courtauction-test.png', fullPage: true });
    console.log('\n스크린샷 저장: /tmp/courtauction-test.png');

    // 5초 대기 후 종료
    await new Promise(resolve => setTimeout(resolve, 5000));
    await browser.close();

  } catch (error) {
    console.error('오류:', error);
    await page.screenshot({ path: '/tmp/courtauction-test-error.png', fullPage: true });
    await browser.close();
  }
})();
