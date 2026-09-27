'use client';
import { setPassword } from '@/app/actions/admin';
import { Status,useEditor,InputField } from './shared';
import Link from 'next/link';
export function PasswordForm(){const e=useEditor();return <form className="admin-panel" onSubmit={async event=>{event.preventDefault();const f=new FormData(event.currentTarget);await e.run(()=>setPassword(String(f.get('password'))));}}><InputField label="New password" hint="Use at least 12 characters."><input className="admin-input" name="password" type="password" minLength={12} maxLength={200} autoComplete="new-password" required/></InputField><Status result={e.result}/><div className="admin-actions"><button className="button button-gold" disabled={e.pending}>Set password</button>{e.result?.ok&&<Link href="/admin" className="button button-dark-outline">Open workspace</Link>}</div></form>;}
