import type { Appearance, Category, Dish, Settings, SiteContent } from './types';
export const defaultContent: SiteContent = {
  hero_eyebrow: 'Food · People · A warmer tomorrow', hero_title: 'Refined dining,\nrooted in warmth.',
  hero_description: 'BUKO is a modern premium dining experience, inspired by our roots and crafted for today. Exceptional food, genuine hospitality, and a table for everyone.', hero_image: '/images/hero-steak.webp', hero_mobile_image: '/images/hero-steak.webp', hero_desktop_x: 50, hero_mobile_x: 66,
  primary_label: 'Book a Table', secondary_label: 'View Menu',
  story_title: 'A Modern Table\nwith Deeper Roots', story_body: 'BUKO, derived from Mazibuko, is a celebration of heritage, people and possibility. We bring together bold flavours, seasonal ingredients and a deep sense of community, creating a dining experience that feels both elevated and familiar.',
  story_image: '/images/story-steak.webp', reservation_title: 'Good food\ntastes better\ntogether.', atmosphere_quote: 'A restaurant is a place\nwhere strangers become family.', atmosphere_image: '/images/interior-v2.webp',
  sections: ['story', 'dishes', 'reservations', 'atmosphere'], hidden_sections: [],
};
export const defaultSettings: Settings = { name: 'BUKO', phone: '', email: '', address: '', map_url: '', instagram_url: '', hours: [], closures: [], booking_enabled: false, max_party: 8, lead_hours: 4, horizon_days: 90, interval_minutes: 30, menu_mode: 'digital', privacy_contact: '' };
export const defaultAppearance: Appearance = { palette: 'gold', font: 'editorial', image_treatment: 'natural', logo: '' };
/**
 * SAMPLE MENU — a placeholder tasting of what BUKO serves, shown only until the
 * kitchen publishes real dishes from the dashboard. The moment one menu item is
 * published in /admin/menu, every dish below disappears from the public site.
 * Names, descriptions and prices here are illustrative, not confirmed.
 */
export const sampleCategories: Category[] = [
  { id: 'starters', name: 'To begin', sort_order: 0, status: 'published' },
  { id: 'mains', name: 'From the kitchen', sort_order: 1, status: 'published' },
  { id: 'desserts', name: 'Something sweet', sort_order: 2, status: 'published' },
  { id: 'drinks', name: 'From the bar', sort_order: 3, status: 'published' },
];
/** The three photographed dishes lead the list — the homepage shows these as its signatures. */
export const sampleDishes: Dish[] = [
  { id: 'lamb', name: 'Karoo Lamb', description: 'Slow-roasted lamb with a herb crust, burnt onion purée and seasonal greens.', image: '/images/lamb-v2.webp', category_id: 'mains', price: 295, dietary: '', allergens: '', available: true, featured: true, sort_order: 0, status: 'published' },
  { id: 'fish', name: 'Line-Caught Kingklip', description: 'Citrus beurre blanc, charred fennel and vegetables of the season.', image: '/images/kingklip-v2.webp', category_id: 'mains', price: 265, dietary: '', allergens: 'Fish, dairy', available: true, featured: true, sort_order: 1, status: 'published' },
  { id: 'chocolate', name: 'Dark Chocolate Mousse', description: 'A rich chocolate finish with honeycomb, burnt orange and cocoa nib.', image: '/images/chocolate-v2.webp', category_id: 'desserts', price: 110, dietary: '', allergens: 'Dairy, eggs', available: true, featured: true, sort_order: 0, status: 'published' },
  { id: 'prawns', name: 'Grilled Prawn Skewers', description: 'Peri-peri butter, charred lemon and a garlic crumb.', image: '', category_id: 'starters', price: 145, dietary: '', allergens: 'Shellfish, dairy', available: true, featured: false, sort_order: 0, status: 'published' },
  { id: 'tartare', name: 'Beef Tartare', description: 'Hand-cut fillet, smoked egg yolk and sourdough crisps.', image: '', category_id: 'starters', price: 135, dietary: '', allergens: 'Eggs, gluten', available: true, featured: false, sort_order: 1, status: 'published' },
  { id: 'trout', name: 'Cured Trout', description: 'Beetroot, horseradish crème fraîche and toasted rye.', image: '', category_id: 'starters', price: 150, dietary: '', allergens: 'Fish, dairy, gluten', available: true, featured: false, sort_order: 2, status: 'published' },
  { id: 'butternut', name: 'Roasted Butternut Soup', description: 'Coconut cream, toasted seeds and a thread of curry oil.', image: '', category_id: 'starters', price: 95, dietary: 'Vegan', allergens: '', available: true, featured: false, sort_order: 3, status: 'published' },
  { id: 'sirloin', name: 'Dry-Aged Sirloin', description: 'Bone marrow jus, triple-cooked potatoes and watercress.', image: '', category_id: 'mains', price: 320, dietary: '', allergens: 'Dairy', available: true, featured: false, sort_order: 2, status: 'published' },
  { id: 'shortrib', name: 'Slow-Braised Short Rib', description: 'Red wine reduction, creamed samp and gremolata.', image: '', category_id: 'mains', price: 285, dietary: '', allergens: 'Dairy', available: true, featured: false, sort_order: 3, status: 'published' },
  { id: 'curry', name: 'Cape Malay Vegetable Curry', description: 'Apricot sambal, turmeric rice and warm roti.', image: '', category_id: 'mains', price: 195, dietary: 'Vegan', allergens: 'Gluten', available: true, featured: false, sort_order: 4, status: 'published' },
  { id: 'chicken', name: 'Free-Range Chicken', description: 'Lemon and thyme, charred baby marrow and pan juices.', image: '', category_id: 'mains', price: 235, dietary: '', allergens: '', available: true, featured: false, sort_order: 5, status: 'published' },
  { id: 'malva', name: 'Malva Pudding', description: 'The classic, warm from the oven, with Amarula custard.', image: '', category_id: 'desserts', price: 95, dietary: 'Vegetarian', allergens: 'Dairy, eggs, gluten', available: true, featured: false, sort_order: 1, status: 'published' },
  { id: 'pannacotta', name: 'Buttermilk Panna Cotta', description: 'Granadilla, toasted oats and a little honey.', image: '', category_id: 'desserts', price: 105, dietary: 'Vegetarian', allergens: 'Dairy', available: true, featured: false, sort_order: 2, status: 'published' },
  { id: 'cheese', name: 'A Plate of Cheese', description: 'Three cheeses from the Cape, preserves and seed crackers.', image: '', category_id: 'desserts', price: 160, dietary: 'Vegetarian', allergens: 'Dairy, gluten', available: true, featured: false, sort_order: 3, status: 'published' },
  { id: 'negroni', name: 'Rooibos Negroni', description: 'Rooibos-infused gin, sweet vermouth and bitters.', image: '', category_id: 'drinks', price: 125, dietary: '', allergens: '', available: true, featured: false, sort_order: 0, status: 'published' },
  { id: 'mcc', name: 'Cape Sparkling', description: 'Méthode Cap Classique, brut. By the glass.', image: '', category_id: 'drinks', price: 95, dietary: '', allergens: 'Sulphites', available: true, featured: false, sort_order: 1, status: 'published' },
  { id: 'chenin', name: 'Chenin Blanc', description: 'Stellenbosch. Crisp, citrus and stone fruit. By the glass.', image: '', category_id: 'drinks', price: 85, dietary: '', allergens: 'Sulphites', available: true, featured: false, sort_order: 2, status: 'published' },
  { id: 'pinotage', name: 'Pinotage', description: 'Smoky, dark fruit and soft tannins. By the glass.', image: '', category_id: 'drinks', price: 95, dietary: '', allergens: 'Sulphites', available: true, featured: false, sort_order: 3, status: 'published' },
];
