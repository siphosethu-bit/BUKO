import 'server-only';
import { db, configured } from './supabase';
import { defaultAppearance, defaultContent, defaultSettings, sampleCategories, sampleDishes } from './defaults';
import type { Appearance, Category, Dish, MenuDocument, Settings, SiteContent } from './types';
import { menuContent } from './menu-content';
export async function getSite(preview = false) {
  if (!configured()) return { content: defaultContent, settings: defaultSettings, appearance: defaultAppearance, dishes: sampleDishes, categories: sampleCategories, documents: [] as MenuDocument[], connected: false, sampleMenu: true };
  const client = await db();
  if (preview) { const { requireStaff } = await import('./auth'); await requireStaff(); }
  const [configs, dishes, categories, documents] = await Promise.all([
    client.from(preview ? 'site_config' : 'public_config').select('*'),
    client.from(preview ? 'menu_items' : 'public_menu').select('*').eq('status', 'published').order('sort_order'),
    client.from('public_categories').select('*').order('sort_order'),
    client.from('public_documents').select('*').order('version', { ascending: false }),
  ]);
  for (const result of [configs, dishes, categories, documents]) if (result.error) throw new Error('We could not load the restaurant information. Please try again shortly.');
  const value = <T,>(key: string, fallback: T): T => { const row = configs.data?.find(r => r.key === key); return { ...fallback, ...(preview ? row?.draft ?? row?.published : row?.published) }; };
  const content = value<SiteContent>('content', defaultContent);
  // Upgrade bundled artwork while preserving any photographs uploaded by the owner.
  for (const key of ['hero_image', 'hero_mobile_image'] as const) {
    if (/^\/images\/hero(?:-mobile)?(?:-v[23])?\.webp$/.test(content[key])) content[key] = '/images/hero-steak.webp';
  }
  if (content.story_image === '/images/story.webp') content.story_image = '/images/story-steak.webp';
  // Until the kitchen publishes its first dish, show the sample menu so the page is never bare.
  // Publishing a single menu item in the dashboard replaces every sample below.
  const published = (dishes.data ?? []).map(d => preview && d.draft ? {...d, ...d.draft} : d) as Dish[];
  return { content, settings: value<Settings>('settings', defaultSettings), appearance: value<Appearance>('appearance', defaultAppearance), ...menuContent(published, categories.data as Category[]), documents: documents.data as MenuDocument[], connected: true };
}
