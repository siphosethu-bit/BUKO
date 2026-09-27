import { test } from 'node:test';
import assert from 'node:assert/strict';
import { menuContent } from '../src/lib/menu-content';
import { sampleDishes } from '../src/lib/defaults';

test('an empty published menu gets the temporary dishes and their categories', () => {
  const menu = menuContent([], []);
  assert.equal(menu.sampleMenu, true);
  assert.equal(menu.dishes.length, 18);
  assert.ok(menu.dishes.every(d => menu.categories.some(c => c.id === d.category_id)));
});
test('one admin-published item fully replaces samples, including when sold out', () => {
  const dish = {...sampleDishes[0], id:'owner-dish', name:'Our new dish', available:false};
  const menu = menuContent([dish], []);
  assert.equal(menu.sampleMenu, false);
  assert.deepEqual(menu.dishes, [dish]);
});
test('draft and archived dishes do not leak into the public menu', () => {
  const menu = menuContent([{...sampleDishes[0],status:'draft'}, {...sampleDishes[1],status:'archived'}], []);
  assert.equal(menu.sampleMenu, true);
});
