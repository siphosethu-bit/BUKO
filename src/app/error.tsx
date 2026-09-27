'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="standalone"><span className="wordmark">BUKO</span><h1>Something needs a moment.</h1><p>We couldn’t load this page. Please try again.</p><button className="button button-gold" onClick={reset}>Try again</button><Link href="/">Back to home</Link></main>;}
