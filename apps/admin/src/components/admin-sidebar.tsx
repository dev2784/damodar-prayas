'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav=[
  ['⌂','Dashboard','/'],
  ['＋','Add Entry','/assisted-entry'],
  ['♡','Matrimony','/matrimony'],
  ['▤','Community','/community'],
  ['◈','Samiti','/samiti'],
  ['⌁','Advertisements','/advertisements'],
  ['⚑','Reports','/reports'],
  ['◎','Users','/users'],
  ['⚙','Settings','/settings'],
] as const;

export default function AdminSidebar(){
  const pathname=usePathname();
  return <aside className="sidebar">
    <div className="brand"><div className="brand-seal">DP</div><div><strong>दामोदर प्रयास</strong><span>ADMIN PORTAL</span></div></div>
    <nav className="nav-list">{nav.map(([icon,label,href])=>{
      const active=href==='/'?pathname==='/':pathname===href||pathname.startsWith(`${href}/`);
      return <Link className={active?'nav-item active':'nav-item'} href={href} key={label}><span>{icon}</span>{label}</Link>;
    })}</nav>
    <div className="sidebar-note"><span>सुरक्षित प्रशासन</span><p>Approval-first moderation keeps community content trusted.</p></div>
  </aside>;
}
