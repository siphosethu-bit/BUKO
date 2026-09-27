import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', error => console.log('Page error:', error.message));
for (const [name,width] of [['desktop',1440],['mobile',390]]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://localhost:3000/menu',{waitUntil:'networkidle'});
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{}))); });
  await page.screenshot({path:`.local/menu-${name}.png`,fullPage:true});
  console.log(name, await page.locator('.menu-row').count(), 'dishes', await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));
}
await page.getByRole('button',{name:'Something sweet',exact:true}).click();
console.log('Dessert filter:',await page.locator('.menu-row-name').allTextContents());
await page.getByRole('button',{name:'All',exact:true}).click();
await page.getByRole('searchbox').fill('curry');
console.log('Search:',await page.locator('.menu-row-name').allTextContents());
await page.goto('http://localhost:3000/reservations',{waitUntil:'networkidle'});
await page.getByRole('button',{name:/Open the floor plan/}).click();
await page.waitForFunction(()=>document.getAnimations().every(a=>a.playState!=='running'||a.effect?.getTiming().iterations===Infinity));
await page.screenshot({path:'.local/picker-dark-mobile.png'});
await page.setViewportSize({width:1440,height:1000});
await page.screenshot({path:'.local/picker-dark-desktop.png'});
await browser.close();
