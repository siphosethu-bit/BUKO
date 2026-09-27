import { configData } from '@/lib/admin-data';
import { SettingsEditor } from '@/components/admin/config-editors';
import { AdminHeading } from '@/components/admin/shared';
export default async function Page(){return <><AdminHeading title="The restaurant details." description="Business information, opening hours and how guests can book."/><SettingsEditor {...await configData('settings')}/></>;}
