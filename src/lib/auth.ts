import 'server-only';
import { redirect } from 'next/navigation';
import { configured, db } from './supabase';
import type { Role } from './types';
export async function requireStaff(owner = false) {
  if (!configured()) redirect('/admin/login');
  const client = await db();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await client.from('staff_profiles').select('*').eq('id', user.id).eq('active', true).single();
  if (!profile || (owner && profile.role !== 'owner')) throw new Error('You do not have permission to perform this action.');
  return { client, user, profile: profile as { id: string; name: string; role: Role; active: boolean } };
}
