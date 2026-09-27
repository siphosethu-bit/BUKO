import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {const url=process.env.NEXT_PUBLIC_SITE_URL;if(!url)return [];return ['','/menu','/our-story','/reservations','/contact','/privacy','/terms'].map(path=>({url:`${url}${path}`}));}
