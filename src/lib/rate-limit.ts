import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { serviceDb } from './supabase';
export async function rateLimit(scope:string,identity=''){
  if(!process.env.RATE_LIMIT_SECRET) throw new Error('Submissions are not available yet. Please try again later.');
  const h=await headers();const ip=h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||h.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';
  const key=createHmac('sha256',process.env.RATE_LIMIT_SECRET).update(`${scope}:${ip}:${identity}`).digest('hex');
  const limit=scope==='login'?10:scope==='availability'?90:5;
  const {data,error}=await serviceDb().rpc('consume_rate_limit',{p_key:key,p_limit:limit,p_window_seconds:900});
  if(error)throw new Error('Submissions are temporarily unavailable.');
  if(!data)throw new Error('Too many attempts. Please try again in 15 minutes.');
}
