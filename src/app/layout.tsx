import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import './reference.css';
import './photography.css';
import './menu.css';
import './seating.css';
import './seat-picker-dark.css';
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','500','600'], style: ['normal','italic'], variable: '--font-serif', display: 'swap' });
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), title: { default: 'BUKO | A place at our table', template: '%s | BUKO' }, description: 'Modern African flavours, warm hospitality and the pleasure of a shared table. Discover BUKO.', openGraph: { title: 'BUKO | A place at our table', description: 'Rooted in heritage. Made for the moments we share.', images: ['/images/hero-steak.webp'] } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en-ZA"><body className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>{children}</body></html>; }
