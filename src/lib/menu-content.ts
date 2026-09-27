import { sampleCategories, sampleDishes } from './defaults';
import type { Category, Dish } from './types';

/** Temporary menu content never merges into the restaurant's published menu. */
export function menuContent(dishes: Dish[], categories: Category[]) {
  const published = dishes.filter(d => d.status === 'published');
  return published.length
    ? { dishes: published, categories, sampleMenu: false }
    : { dishes: sampleDishes, categories: sampleCategories, sampleMenu: true };
}
