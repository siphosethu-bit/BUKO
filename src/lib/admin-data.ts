import { requireStaff } from './auth';
import { defaultAppearance,defaultContent,defaultSettings } from './defaults';
export async function configData(key:'content'|'settings'|'appearance'){
  const {client}=await requireStaff(key!=='content');
  const [config,assets,revisions]=await Promise.all([client.from('site_config').select('*').eq('key',key).single(),client.from('media_assets').select('*').eq('type','image').order('created_at',{ascending:false}),client.from('content_revisions').select('id,created_at').eq('resource','site_config').eq('resource_id',key).order('created_at',{ascending:false}).limit(20)]);
  if(config.error)throw new Error('Could not load these settings.');
  return {initial:{...({content:defaultContent,settings:defaultSettings,appearance:defaultAppearance}[key]),...(config.data.draft||config.data.published)},assets:assets.data||[],revisions:revisions.data||[],hasDraft:!!config.data.draft};
}
