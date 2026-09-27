import { getSite } from '@/lib/data';
import { Home } from '@/components/home';
export default async function Page() { return <Home site={await getSite()}/>; }
