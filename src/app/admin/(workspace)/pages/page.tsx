import { configData } from '@/lib/admin-data';
import { ContentEditor } from '@/components/admin/config-editors';
import { AdminHeading } from '@/components/admin/shared';
export default async function Page(){return <><AdminHeading title="Your story, in your words." description="Edit the homepage, arrange sections and preview changes before publishing."/><ContentEditor {...await configData('content')}/></>;}
