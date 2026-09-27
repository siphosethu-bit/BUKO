import { z } from 'zod';
const text = (max: number) => z.string().trim().max(max);
const email = z.email().max(254);
export const reservationSchema = z.object({
  name: text(100).min(2,'Please enter your name.'), email,
  phone: text(30).regex(/^[+\d\s()-]{7,30}$/,'Please enter a valid contact number.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/),
  party_size: z.coerce.number<number>().int().min(1).max(100), requests: text(1000),
  table_id: text(40).default(''),
  /** Comma-separated seat ids, e.g. "M1-1,M1-2". Empty means no seat preference. */
  seat_ids: text(300).default('').refine(v => !v || /^[A-Za-z0-9]+-\d+(,[A-Za-z0-9]+-\d+)*$/.test(v), 'Choose your seats from the floor plan.'),
  consent: z.literal(true, {error:'Please accept the privacy notice.'}), website: text(200).max(0),
  request_id: z.uuid(),
});
/** Validated output, used server-side: `table_id` is always present. */
export type ReservationInput = z.infer<typeof reservationSchema>;
/** Form-side values, where `table_id` may be omitted before the guest picks a table. */
export type ReservationFormInput = z.input<typeof reservationSchema>;
export const enquirySchema = z.object({name:text(100).min(2), email, message:text(3000).min(10,'Please add a little more detail.'), consent:z.literal(true), website:text(200).max(0), request_id:z.uuid()});
export const loginSchema = z.object({ email, password:z.string().min(1).max(200) });
const safeUrl = z.string().max(2000).refine(v => !v || /^\/images\/[a-zA-Z0-9._/-]+$/.test(v) || /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co\/storage\/v1\/object\/public\/restaurant-media\//.test(v),'Choose an uploaded image or a bundled image.');
export const dishSchema = z.object({name:text(120).min(2),description:text(1000),category_id:z.uuid().nullable(),price:z.number().min(0).max(100000).nullable(),image:safeUrl,dietary:text(300),allergens:text(500),available:z.boolean(),featured:z.boolean(),sort_order:z.number().int().min(0).max(9999),status:z.enum(['draft','published','archived'])});
export const categorySchema = z.object({name:text(100).min(1),sort_order:z.number().int().min(0).max(9999),status:z.enum(['draft','published','archived'])});
export const documentSchema = z.object({name:text(120).min(1),url:safeUrl.refine(v=>v.endsWith('.pdf'),'Select an uploaded PDF.'),version:z.number().int().min(1),status:z.enum(['draft','published','archived'])});
const sections=z.array(z.enum(['story','dishes','reservations','atmosphere'])).max(4).refine(v=>new Set(v).size===v.length);
export const contentSchema = z.object({hero_eyebrow:text(90).min(1),hero_title:text(150).min(1),hero_description:text(400),hero_image:safeUrl,hero_mobile_image:safeUrl,hero_desktop_x:z.number().min(0).max(100),hero_mobile_x:z.number().min(0).max(100),primary_label:text(40).min(1),secondary_label:text(40).min(1),story_title:text(150).min(1),story_body:text(2000),story_image:safeUrl,reservation_title:text(150).min(1),atmosphere_quote:text(200),atmosphere_image:safeUrl,sections,hidden_sections:sections});
const publicUrl=z.string().max(2000).refine(v=>!v||/^https:\/\//.test(v),'Use an HTTPS link.');
export const settingsSchema=z.object({name:z.literal('BUKO'),phone:text(30).refine(v=>!v||/^[+\d\s()-]+$/.test(v)),email:z.union([email,z.literal('')]),address:text(500),map_url:publicUrl,instagram_url:publicUrl,hours:z.array(z.object({day:z.number().int().min(0).max(6),open:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),close:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}).refine(h=>h.open<h.close,'Closing time must be after opening time.')).max(7).refine(v=>new Set(v.map(h=>h.day)).size===v.length,'Each day may appear once.'),closures:z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(366),booking_enabled:z.boolean(),max_party:z.number().int().min(1).max(100),lead_hours:z.number().min(0).max(720),horizon_days:z.number().int().min(1).max(365),interval_minutes:z.union([z.literal(15),z.literal(30),z.literal(60)]),menu_mode:z.enum(['digital','pdf','both']),privacy_contact:z.union([email,z.literal('')])}).refine(s=>!s.booking_enabled||s.hours.length>0,'Set opening hours before enabling reservations.');
export const appearanceSchema=z.object({palette:z.enum(['gold','olive','clay']),font:z.enum(['editorial','classic']),image_treatment:z.enum(['natural','warm']),logo:safeUrl});
