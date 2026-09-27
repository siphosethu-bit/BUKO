import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
export async function GET(request:NextRequest){const code=request.nextUrl.searchParams.get('code');const token_hash=request.nextUrl.searchParams.get('token_hash');const client=await db();let ok=false;if(code){const {error}=await client.auth.exchangeCodeForSession(code);ok=!error;}else if(token_hash){const {error}=await client.auth.verifyOtp({token_hash,type:'invite'});ok=!error;}return NextResponse.redirect(new URL(ok?'/admin/set-password':'/admin/login',request.url));}
