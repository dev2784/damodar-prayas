'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav=[
  ['⌂','Dashboard','/'],
  ['♡','Matrimony','/matrimony'],
  ['▤','Community','/community'],
  ['◈','Samiti','/samiti'],
  ['⌁','Advertisements','/community?filter=ADVERTISEMENT'],
  ['⚑','Reports','#'],
  ['◎','Users','#'],
] as const;

export default function AdminSidebar(){
  const pathname=usePathname();
  return <aside className="sidebar">
    <div className="brand"><div className="brand-seal">DP</div><div><strong>दामोदर प्रयास</strong><span>ADMIN PORTAL</span></div></div>
    <nav className="nav-list">{nav.map(([icon,label,href])=>{
      const active=href==='/'?pathname==='/':href.startsWith('/community?')?false:pathname===href||pathname.startsWith(`${href}/`);
      return href==='#'
        ? <span className="nav-item" key={label} style={{opacity:.55,cursor:'not-allowed'}}><span>{icon}</span>{label}</span>
        : <Link className={active?'nav-item active':'nav-item'} href={href} key={label}><span>{icon}</span>{label}</Link>;
    })}</nav>
    <div className="sidebar-note"><span>सुरक्षित प्रशासन</span><p>Approval-first moderation keeps community content trusted.</p></div>
  </aside>;
}
