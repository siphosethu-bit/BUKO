import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getSite } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function PublicLayout({ children }: { children: React.ReactNode }) { const {settings, appearance} = await getSite(); return <div data-palette={appearance.palette} data-font={appearance.font} data-treatment={appearance.image_treatment}><Header logo={appearance.logo}/>{children}<Footer settings={settings}/></div>; }
