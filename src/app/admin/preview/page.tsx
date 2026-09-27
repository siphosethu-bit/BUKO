import { getSite } from '@/lib/data';
import { requireStaff } from '@/lib/auth';
import { Home } from '@/components/home';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
export const dynamic='force-dynamic';
export const metadata={title:'Private Preview',robots:{index:false,follow:false}};
export default async function Page(){await requireStaff();const site=await getSite(true);return <div data-palette={site.appearance.palette} data-font={site.appearance.font} data-treatment={site.appearance.image_treatment}><Header/><Home site={site} preview/><Footer settings={site.settings}/></div>;}
