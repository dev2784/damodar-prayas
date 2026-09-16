'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminUser, clearAdminSession, verifyAdminSession } from '@/lib/auth';

const nav = [['⌂','Dashboard'],['♡','Matrimony'],['▤','Community'],['◈','Samiti'],['⌁','Advertisements'],['⚑','Reports'],['◎','Users']];
const approvals = [
  { icon:'♡', label:'Matrimony', count:'—', note:'Pending profiles' },
  { icon:'◈', label:'Samiti', count:'—', note:'Pending committees' },
  { icon:'▤', label:'Community', count:'—', note:'News & events' },
  { icon:'⌁', label:'Advertisements', count:'—', note:'Pending ads' },
];
const activity = [
  ['Matrimony','New profile submissions will appear here','Pending'],
  ['Samiti','Committee requests will appear here','Pending'],
  ['Community','News and event requests will appear here','Pending'],
  ['Advertisement','Business advertisements will appear here','Pending'],
];

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function check() {
      const admin = await verifyAdminSession().catch(() => null);
      if (!active) return;
      if (!admin) {
        router.replace('/login');
        return;
      }
      setUser(admin);
      setChecking(false);
    }
    void check();
    return () => { active = false; };
  }, [router]);

  function logout() {
    clearAdminSession();
    router.replace('/login');
  }

  if (checking || !user) return <main className="login-loading">Admin session verify हो रही है…</main>;

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Administrator';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-seal">DP</div><div><strong>दामोदर प्रयास</strong><span>ADMIN PORTAL</span></div></div>
        <nav className="nav-list">{nav.map(([icon,label],index)=><a className={index===0?'nav-item active':'nav-item'} href="#" key={label}><span>{icon}</span>{label}</a>)}</nav>
        <div className="sidebar-note"><span>सुरक्षित प्रशासन</span><p>Approval-first moderation keeps community content trusted.</p></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">DAMODAR PRAYAS • ADMINISTRATION</p><h1>नमस्कार, {user.firstName || 'Admin'}</h1><p className="subtitle">आज की submissions और approvals एक जगह संभालें।</p></div>
          <div className="admin-profile"><div className="avatar">{initial}</div><div><b>{name}</b><span>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin access'}</span></div><button className="logout-btn" onClick={logout}>Logout</button></div>
        </header>
        <section className="notice"><div className="notice-icon">✓</div><div><b>Approval-first workflow active</b><p>कोई भी user-submitted content admin approval के बिना public नहीं होगा।</p></div><span className="status-pill">SYSTEM ACTIVE</span></section>
        <section>
          <div className="section-heading"><div><p className="eyebrow">ACTION REQUIRED</p><h2>Approval Center</h2></div><span className="muted">Live counts अगले चरण में connect होंगे</span></div>
          <div className="approval-grid">{approvals.map(item=><article className="approval-card" key={item.label}><div className="card-top"><span className="card-icon">{item.icon}</span><span className="pending-dot">Pending</span></div><div className="card-count">{item.count}</div><h3>{item.label}</h3><p>{item.note}</p><button className="review-btn">Review requests <span>→</span></button></article>)}</div>
        </section>
        <section className="lower-grid">
          <article className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">MODERATION QUEUE</p><h2>Recent submissions</h2></div><button className="text-btn">View all →</button></div><div className="table-wrap"><table><thead><tr><th>TYPE</th><th>SUBMISSION</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{activity.map(([type,title,status])=><tr key={type}><td><span className="type-chip">{type}</span></td><td>{title}</td><td><span className="pending-dot">{status}</span></td><td><button className="small-btn">Review</button></td></tr>)}</tbody></table></div></article>
          <article className="panel summary-panel"><p className="eyebrow">QUICK OVERVIEW</p><h2>System summary</h2><div className="summary-row"><span>Published content</span><b>Live</b></div><div className="summary-row"><span>Approval policy</span><b>Required</b></div><div className="summary-row"><span>Admin API</span><b>Ready</b></div><div className="summary-divider"/><p className="summary-copy">Backend में Matrimony, Community, Samiti, Media और Reports के admin routes मौजूद हैं। अगले चरण में dashboard इन्हीं live APIs से जुड़ेगा।</p></article>
        </section>
      </main>
    </div>
  );
}
