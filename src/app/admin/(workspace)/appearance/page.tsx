import { configData } from '@/lib/admin-data';
import { AppearanceEditor } from '@/components/admin/config-editors';
import { AdminHeading } from '@/components/admin/shared';
export default async function Page(){return <><AdminHeading title="Make it feel like BUKO." description="A few considered choices, with your layout kept in good shape."/><AppearanceEditor {...await configData('appearance')}/></>;}
