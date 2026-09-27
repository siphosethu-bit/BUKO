import { requireStaff } from '@/lib/auth';
import { AdminHeading } from '@/components/admin/shared';
import { TeamEditor } from '@/components/admin/team-editor';
export default async function Page(){const {client,user}=await requireStaff(true);const {data}=await client.from('staff_profiles').select('*').order('created_at');return <><AdminHeading title="The people behind BUKO." description="Invite trusted staff and manage their access."/><TeamEditor staff={data||[]} currentId={user.id}/></>;}
