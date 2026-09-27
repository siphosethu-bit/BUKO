export type Role = 'owner' | 'editor';
export type Dish = { id: string; name: string; description: string; category_id: string | null; price: number | null; image: string; dietary: string; allergens: string; available: boolean; featured: boolean; sort_order: number; status: 'draft' | 'published' | 'archived' };
export type Category = { id: string; name: string; sort_order: number; status: string };
export type SiteContent = {
  hero_eyebrow: string; hero_title: string; hero_description: string; hero_image: string; hero_mobile_image: string;
  hero_desktop_x: number; hero_mobile_x: number; primary_label: string; secondary_label: string;
  story_title: string; story_body: string; story_image: string; reservation_title: string; atmosphere_quote: string; atmosphere_image: string;
  sections: string[]; hidden_sections: string[];
};
export type Settings = { name: string; phone: string; email: string; address: string; map_url: string; instagram_url: string; hours: { day: number; open: string; close: string }[]; closures: string[]; booking_enabled: boolean; max_party: number; lead_hours: number; horizon_days: number; interval_minutes: number; menu_mode: 'digital' | 'pdf' | 'both'; privacy_contact: string };
export type Appearance = { palette: 'gold' | 'olive' | 'clay'; font: 'editorial' | 'classic'; image_treatment: 'natural' | 'warm'; logo: string };
export type MenuDocument = { id: string; name: string; url: string; version: number; status: string; created_at: string };
