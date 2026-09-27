'use client';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {useRef,useEffect,useState} from 'react';
import {Menu,X,Search} from 'lucide-react';
const links=[['/','Home'],['/menu','Menu'],['/our-story','About'],['/reservations','Reservations'],['/contact','Contact']];
export function Header({logo=''}:{logo?:string}){
  const path=usePathname();const dialog=useRef<HTMLDialogElement>(null);const [open,setOpen]=useState(false);
  useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[open]);
  function close(){dialog.current?.close();setOpen(false);}
  return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header reference-header"><Link href="/" aria-label="BUKO home" className="wordmark">{logo?<Image className="custom-logo" src={logo} alt="BUKO" width={165} height={50}/>:<>BUKO<span>GOOD FOOD BRINGS PEOPLE HOME</span></>}</Link><nav aria-label="Main navigation" className="desktop-nav">{links.map(([href,label])=><Link key={href} href={href} aria-current={path===href?'page':undefined}>{label}</Link>)}</nav><div className="header-motto">More than a meal,<br/>a sense of belonging.</div><Link className="header-search" href="/menu?search=true" aria-label="Search the menu"><Search size={19} strokeWidth={1.6}/></Link><Link href="/reservations" className="header-book">Book a Table</Link><button className="mobile-toggle" aria-label="Open navigation" aria-expanded={open} onClick={()=>{dialog.current?.showModal();setOpen(true);}}><Menu size={23}/></button></header><dialog ref={dialog} className="nav-dialog" onClose={()=>setOpen(false)} onClick={e=>{if(e.target===dialog.current)close();}} aria-label="Navigation"><div className="drawer-top"><span className="wordmark">BUKO</span><button className="icon-button" aria-label="Close navigation" onClick={close}><X/></button></div><nav>{links.map(([href,label])=><Link key={href} href={href} onClick={close}>{label}</Link>)}</nav><p>A little closer to home.</p></dialog></>;
}
