import Image from 'next/image';
import Link from 'next/link';
import { configured } from '@/lib/supabase';
import { LoginForm } from '@/components/admin/login-form';
export const metadata={title:'Staff Sign In',robots:{index:false,follow:false}};
export default function Page(){return <main className="login-page"><div className="login-image"><Image src="/images/story.webp" alt="A dish being finished in the kitchen" fill priority sizes="50vw"/><div><span className="eyebrow" style={{color:'#d0b58c'}}>Behind every good evening</span><h2>A little care.<br/>A lot of heart.</h2></div></div><div className="login-main"><Link href="/" className="wordmark">BUKO</Link><h1>Welcome back.</h1><p>A place to look after the details, so your team can look after the guests.</p><LoginForm configured={configured()}/><Link href="/" className="text-link">Back to the restaurant ↗</Link></div></main>;}
