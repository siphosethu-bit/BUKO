import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
let script='';let css='';
test.beforeAll(async()=>{
  const bundle=await build({entryPoints:['tests/fixtures/seating-harness.tsx'],bundle:true,write:false,format:'iife',platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"test"'}});
  script=bundle.outputFiles[0].text;css=(await readFile('src/app/globals.css','utf8'))+'\n'+(await readFile('src/app/seating.css','utf8'))+'\n'+(await readFile('src/app/seat-picker-dark.css','utf8'));
});
test.beforeEach(async({page})=>{
  await page.route('http://floorplan.test/',r=>r.fulfill({contentType:'text/html',body:'<!DOCTYPE html><html lang="en"><head><title>Seating test</title></head><body><div id="root"></div></body></html>'}));
  // W2 is held as a whole table; only seat 1 of M1 is taken.
  await page.route('**/api/table-availability?*',r=>r.fulfill({json:{ok:true,bookings:[{table_id:'W2',time:'18:00',seat_ids:''},{table_id:'M1',time:'19:00',seat_ids:'M1-1'}]}}));
  await page.goto('http://floorplan.test/');await page.addStyleTag({content:css});await page.addScriptTag({content:script});
});
const openPlan=async(page:import('@playwright/test').Page)=>{await page.getByRole('button',{name:/Open the floor plan|Change your seats/}).click();return page.getByRole('dialog');};

test('a guest picks individual chairs and carries them back to the form',async({page})=>{
  const dialog=await openPlan(page);
  await expect(dialog.getByRole('button',{name:/Table 2, seat 1, Already taken/})).toHaveAttribute('aria-disabled','true');
  await dialog.getByRole('button',{name:/Table 1, seat 1, Available/}).click();
  await expect(dialog.getByRole('button',{name:/Table 1, seat 1/})).toHaveAttribute('aria-pressed','true');
  await expect(dialog.getByText('of 2 seats chosen')).toBeVisible();
  await dialog.getByRole('button',{name:/Table 1, seat 2, Available/}).click();
  await expect(dialog.locator('.seat-chip').filter({hasText:'seat 2'})).toBeVisible();
  await dialog.getByRole('button',{name:'Choose 2 seats'}).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByTestId('chosen')).toHaveText('W1-1,W1-2');
  await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe('');
});

test('a taken seat cannot be chosen, and the party size caps the selection',async({page})=>{
  const dialog=await openPlan(page);
  await dialog.getByRole('button',{name:/Table 2, seat 1, Already taken/}).click({force:true});
  await expect(dialog.getByText('0 of 2 seats chosen')).toBeVisible();
  await dialog.getByRole('button',{name:/Table 1, seat 1, Available/}).click();
  await dialog.getByRole('button',{name:/Table 1, seat 2, Available/}).click();
  // A third seat exceeds the two guests booked for.
  await dialog.getByRole('button',{name:/Table 3, seat 1, Available/}).click();
  await expect(dialog.getByText(/Change the guest count to choose more seats/)).toBeVisible();
  await expect(dialog.getByText('of 2 seats chosen')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Choose 2 seats'})).toBeEnabled();
});

test('tapping a table sweeps up every free seat at it',async({page})=>{
  await page.getByLabel('Guests').selectOption('4');
  const dialog=await openPlan(page);
  await dialog.getByRole('button',{name:/^Table 4, 4 seats/}).click();
  await expect(dialog.getByText('3 of 4 seats chosen')).toBeVisible();
  await expect(dialog.getByRole('button',{name:'Choose 3 seats'})).toBeEnabled();
  // Tapping again releases them.
  await dialog.getByRole('button',{name:/^Table 4, 4 seats/}).click();
  await expect(dialog.getByRole('button',{name:'Choose your seats'})).toBeDisabled();
});

test('a seat chip removes its seat, and zone filters narrow the room',async({page})=>{
  const dialog=await openPlan(page);
  await dialog.getByRole('button',{name:/Table 1, seat 1, Available/}).click();
  await dialog.getByRole('button',{name:/Remove Table 1 seat 1/}).click();
  await expect(page.getByTestId('chosen')).toHaveText('none');
  await dialog.locator('.zone-chips button',{hasText:'Terrace'}).click();
  await expect(dialog.locator('.zone-chips button',{hasText:'Terrace'})).toHaveAttribute('aria-pressed','true');
});

test('network errors never show seats as free, and retry recovers',async({page})=>{
  await page.route('**/api/table-availability?*',r=>r.fulfill({status:503,json:{ok:false,message:'Availability could not be checked.'}}));
  const dialog=await openPlan(page);
  await expect(dialog.getByText('Availability could not be checked.')).toBeVisible();
  await page.route('**/api/table-availability?*',r=>r.fulfill({json:{ok:true,bookings:[]}}));
  await dialog.getByRole('button',{name:'Try again'}).click();
  await expect(dialog.getByText(/seats free/)).toBeVisible();
});

test('rechecks seats before saving and handles one taken meanwhile',async({page})=>{
  const dialog=await openPlan(page);
  await dialog.getByRole('button',{name:/Table 1, seat 1, Available/}).click();
  await page.route('**/api/table-availability?*',r=>r.fulfill({json:{ok:true,bookings:[{table_id:'W1',time:'18:00',seat_ids:'W1-1'}]}}));
  await dialog.getByRole('button',{name:'Choose 1 seat'}).click();
  await expect(dialog.getByRole('alert')).toContainText('just taken');
  await expect(page.getByTestId('chosen')).toHaveText('none');
});

test('works on narrow screens, by keyboard, and passes an accessibility audit',async({page})=>{
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:850});
    const dialog=await openPlan(page);
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true);
    await page.keyboard.press('Escape');
  }
  const dialog=await openPlan(page);
  await dialog.getByRole('button',{name:/Table 1, seat 1, Available/}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('of 2 seats chosen')).toBeVisible();
  const a11y=await new AxeBuilder({page}).include('.seating-dialog').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(a11y.violations,JSON.stringify(a11y.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))).toEqual([]);
});
