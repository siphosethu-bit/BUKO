'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, Utensils, Images, FileText, Palette, Settings, Users, History } from 'lucide-react';
export function AdminNav({owner}:{owner:boolean}){const path=usePathname();const links=[['/admin','Overview',LayoutDashboard],['/admin/reservations','Reservations',CalendarDays],['/admin/menu','Menu',Utensils],['/admin/media','Media library',Images],['/admin/pages','Website content',FileText],...(owner?[['/admin/appearance','Appearance',Palette],['/admin/settings','Settings',Settings],['/admin/team','Team',Users]]:[]),['/admin/activity','Activity',History]] as const;return <nav aria-label="Staff navigation">{links.map(([href,label,Icon])=><Link key={href as string} href={href as string} aria-current={path===href||(href!=='/admin'&&path.startsWith(href as string))?'page':undefined}><Icon/>{label as string}</Link>)}</nav>;}
