const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    executablePath: process.env.HOME + '/.cache/puppeteer/chrome-headless-shell/linux-152.0.7977.54/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:8124/index.html', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 600));
  const c = {};
  // 弹层关闭（回归）
  c.modalHiddenOnLoad = await page.$eval('#searchModal', (el) => el.hidden);
  await page.click('#btnSearch'); await new Promise((r)=>setTimeout(r,150));
  c.opened = await page.$eval('#searchModal', (el) => !el.hidden);
  await page.keyboard.press('Escape'); await new Promise((r)=>setTimeout(r,150));
  c.closedEsc = await page.$eval('#searchModal', (el) => el.hidden);
  await page.click('#btnSearch'); await new Promise((r)=>setTimeout(r,150));
  await page.click('#searchModal [data-close]'); await new Promise((r)=>setTimeout(r,150));
  c.closedX = await page.$eval('#searchModal', (el) => el.hidden);
  // 工具栏清除按钮
  c.clearHiddenInit = await page.$eval('#searchClear', (el) => el.hidden);
  await page.type('#searchInput', '测试');
  await new Promise((r)=>setTimeout(r,150));
  c.clearShown = await page.$eval('#searchClear', (el) => !el.hidden);
  await page.click('#searchClear');
  await new Promise((r)=>setTimeout(r,150));
  c.inputCleared = await page.$eval('#searchInput', (el) => el.value === '');
  c.clearHiddenAgain = await page.$eval('#searchClear', (el) => el.hidden);
  console.log(JSON.stringify(c, null, 2));
  await browser.close();
})();
