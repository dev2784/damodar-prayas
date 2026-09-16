'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, AdminUser, clearAdminSession, getAdminToken, verifyAdminSession } from '@/lib/auth';

const nav = [['⌂','Dashboard'],['♡','Matrimony'],['▤','Community'],['◈','Samiti'],['⌁','Advertisements'],['⚑','Reports'],['◎','Users']];

type PendingCounts = { matrimony: number; samiti: number; community: number; advertisements: number };
type CommunityPost = { id: string; category?: string; updatedAt?: string; translations?: Array<{ title?: string | null }> };
type MatrimonyItem = { id: string; firstName?: string | null; lastName?: string | null; updatedAt?: string };
type CommitteeItem = { id: string; updatedAt?: string; translations?: Array<{ name?: string | null; title?: string | null }> };
type RecentItem = { id: string; type: string; title: string; updatedAt?: string };

async function adminGet(path: string) {
  const token = getAdminToken();
  if (!token) throw new Error('Admin session missing');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    cache: 'no-store',
  });
  if (response.status === 401 || response.status === 403) throw new Error('SESSION_EXPIRED');
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

function communityTitle(item: CommunityPost) {
  return item.translations?.find((translation) => translation.title)?.title || 'Community submission';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [counts, setCounts] = useState<PendingCounts>({ matrimony: 0, samiti: 0, community: 0, advertisements: 0 });
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const admin = await verifyAdminSession().catch(() => null);
      if (!active) return;
      if (!admin) { router.replace('/login'); return; }
      setUser(admin);
      setChecking(false);

      try {
        const [matrimony, committees, community] = await Promise.all([
          adminGet('/admin/matrimony?status=PENDING&page=1&limit=5'),
          adminGet('/admin/committees?status=PENDING'),
          adminGet('/admin/community?status=PENDING&page=1&limit=50'),
        ]);
        if (!active) return;
        const communityItems = (community.items ?? []) as CommunityPost[];
        const adItems = communityItems.filter((item) => item.category === 'ADVERTISEMENT');
        const normalCommunity = communityItems.filter((item) => item.category !== 'ADVERTISEMENT');
        setCounts({
          matrimony: Number(matrimony.pagination?.total ?? matrimony.items?.length ?? 0),
          samiti: Number(committees.items?.length ?? 0),
          community: normalCommunity.length,
          advertisements: adItems.length,
        });

        const rows: RecentItem[] = [
          ...((matrimony.items ?? []) as MatrimonyItem[]).map((item) => ({ id: item.id, type: 'Matrimony', title: [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Matrimony profile', updatedAt: item.updatedAt })),
          ...((committees.items ?? []) as CommitteeItem[]).slice(0, 5).map((item) => ({ id: item.id, type: 'Samiti', title: item.translations?.[0]?.name || item.translations?.[0]?.title || 'Samiti submission', updatedAt: item.updatedAt })),
          ...communityItems.slice(0, 10).map((item) => ({ id: item.id, type: item.category === 'ADVERTISEMENT' ? 'Advertisement' : 'Community', title: communityTitle(item), updatedAt: item.updatedAt })),
        ];
        rows.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime());
        setRecent(rows.slice(0, 6));
        setQueueError(null);
      } catch (error) {
        if (!active) return;
        if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
          clearAdminSession(); router.replace('/login'); return;
        }
        setQueueError('Pending approvals load नहीं हो पाए। API connection check करें।');
      } finally {
        if (active) setLoadingQueue(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [router]);

  function logout() { clearAdminSession(); router.replace('/login'); }

  const approvals = useMemo(() => [
    { icon:'♡', label:'Matrimony', count: counts.matrimony, note:'Pending profiles' },
    { icon:'◈', label:'Samiti', count: counts.samiti, note:'Pending committees' },
    { icon:'▤', label:'Community', count: counts.community, note:'News & events' },
    { icon:'⌁', label:'Advertisements', count: counts.advertisements, note:'Pending ads' },
  ], [counts]);

  if (checking || !user) return <main className="login-loading">Admin session verify हो रही है…</main>;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Administrator';
  const initial = name.charAt(0).toUpperCase();
  const totalPending = counts.matrimony + counts.samiti + counts.community + counts.advertisements;

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-seal">DP</div><div><strong>दामोदर प्रयास</strong><span>ADMIN PORTAL</span></div></div>
        <nav className="nav-list">{nav.map(([icon,label],index)=><a className={index===0?'nav-item active':'nav-item'} href="#" key={label}><span>{icon}</span>{label}</a>)}</nav>
        <div className="sidebar-note"><span>सुरक्षित प्रशासन</span><p>Approval-first moderation keeps community content trusted.</p></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><p className="eyebrow">DAMODAR PRAYAS • ADMINISTRATION</p><h1>नमस्कार, {user.firstName || 'Admin'}</h1><p className="subtitle">आज की submissions और approvals एक जगह संभालें।</p></div><div className="admin-profile"><div className="avatar">{initial}</div><div><b>{name}</b><span>{user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin access'}</span></div><button className="logout-btn" onClick={logout}>Logout</button></div></header>
        <section className="notice"><div className="notice-icon">✓</div><div><b>Approval-first workflow active</b><p>कोई भी user-submitted content admin approval के बिना public नहीं होगा।</p></div><span className="status-pill">SYSTEM ACTIVE</span></section>
        <section>
          <div className="section-heading"><div><p className="eyebrow">ACTION REQUIRED</p><h2>Approval Center</h2></div><span className="muted">{loadingQueue ? 'Live queue loading…' : queueError ? 'API unavailable' : `${totalPending} total pending`}</span></div>
          {queueError ? <p className="muted">{queueError}</p> : null}
          <div className="approval-grid">{approvals.map(item=><article className="approval-card" key={item.label}><div className="card-top"><span className="card-icon">{item.icon}</span><span className="pending-dot">Pending</span></div><div className="card-count">{loadingQueue ? '…' : item.count}</div><h3>{item.label}</h3><p>{item.note}</p><button className="review-btn">Review requests <span>→</span></button></article>)}</div>
        </section>
        <section className="lower-grid">
          <article className="panel activity-panel"><div className="panel-head"><div><p className="eyebrow">MODERATION QUEUE</p><h2>Recent submissions</h2></div><span className="muted">Live pending data</span></div><div className="table-wrap"><table><thead><tr><th>TYPE</th><th>SUBMISSION</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{loadingQueue ? <tr><td colSpan={4}>Loading submissions…</td></tr> : recent.length === 0 ? <tr><td colSpan={4}>कोई pending submission नहीं है।</td></tr> : recent.map((item)=><tr key={`${item.type}-${item.id}`}><td><span className="type-chip">{item.type}</span></td><td>{item.title}</td><td><span className="pending-dot">Pending</span></td><td><button className="small-btn">Review</button></td></tr>)}</tbody></table></div></article>
          <article className="panel summary-panel"><p className="eyebrow">QUICK OVERVIEW</p><h2>System summary</h2><div className="summary-row"><span>Total pending</span><b>{loadingQueue ? '…' : totalPending}</b></div><div className="summary-row"><span>Approval policy</span><b>Required</b></div><div className="summary-row"><span>Admin API</span><b>{queueError ? 'Check' : 'Connected'}</b></div><div className="summary-divider"/><p className="summary-copy">Dashboard अब Matrimony, Community और Samiti admin APIs से live moderation queue पढ़ रहा है। Advertisement count Community queue की ADVERTISEMENT category से अलग दिखाया जाता है।</p></article>
        </section>
      </main>
    </div>
  );
}
