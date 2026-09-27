import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('.local',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
page.on('pageerror',e=>console.error('PAGE ERROR',e.message));
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 await page.setViewportSize({width,height});
 await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
 await page.screenshot({path:`.local/${name}.png`,fullPage:true});
 console.log(name,await page.title(),await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})));
}
await browser.close();
