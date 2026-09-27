import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
export const configured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export async function db() {
  if (!configured()) throw new Error('Restaurant services are not connected yet.');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: {
    getAll: () => jar.getAll(),
    setAll: (items) => { try { items.forEach(({name, value, options}) => jar.set(name, value, options)); } catch { /* Server components cannot persist refreshed cookies. The proxy handles refresh. */ } },
  } });
}
export function serviceDb() {
  if (!configured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Restaurant services are not connected yet.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
