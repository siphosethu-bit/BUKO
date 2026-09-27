import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { AdminNav } from '@/components/admin/nav';
import { logout } from '@/app/actions/public';
export const dynamic='force-dynamic';
export const metadata={title:'Staff Workspace',robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){const {profile}=await requireStaff();return <div className="admin-shell"><a className="skip-link" href="#main">Skip to workspace</a><aside className="admin-sidebar"><Link className="wordmark" href="/admin">BUKO</Link><span className="eyebrow">Behind the hospitality</span><AdminNav owner={profile.role==='owner'}/><div className="admin-sidebar-bottom">Your restaurant, thoughtfully managed.<Link href="/" target="_blank">Visit website ↗</Link></div></aside><div className="admin-workspace"><header className="admin-topbar"><span>Restaurant workspace</span><div><span className="staff-avatar">{profile.name?.charAt(0).toUpperCase()||'B'}</span>{profile.name||'Staff'} · {profile.role}</div><form action={logout}><button className="button button-small button-dark-outline">Sign out</button></form></header><main id="main" className="admin-body">{children}</main></div></div>;}
