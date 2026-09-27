import { requireStaff } from '@/lib/auth';
import { MediaEditor } from '@/components/admin/media-editor';
import { AdminHeading } from '@/components/admin/shared';
export default async function Page(){const {client}=await requireStaff();const {data}=await client.from('media_assets').select('*').order('created_at',{ascending:false});return <><AdminHeading title="A picture of BUKO." description="Keep your food photography, interiors and menu documents in one place."/><MediaEditor assets={data||[]}/></>;}
