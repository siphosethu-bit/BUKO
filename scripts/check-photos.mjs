import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('Page error:', e.message));
for (const [name, width, url, selector] of [
  ['hero-mobile', 390, '/', '.reference-hero-image img'],
  ['story-desktop', 1440, '/our-story', '.story-photo img'],
  ['story-mobile', 390, '/our-story', '.story-photo img'],
]) {
  await page.setViewportSize({width, height: 950});
  await page.goto(`http://localhost:3000${url}`, {waitUntil: 'networkidle'});
  const img = page.locator(selector);
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(el => el.decode());
  console.log(name, await img.evaluate(el => ({src: el.currentSrc, naturalWidth: el.naturalWidth, rect: el.getBoundingClientRect().toJSON(), display: getComputedStyle(el).display, parentDisplay: getComputedStyle(el.parentElement).display})));
  await page.screenshot({path: `.local/${name}.png`, fullPage: true});
}
await browser.close();
