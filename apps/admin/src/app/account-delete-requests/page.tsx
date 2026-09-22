'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin-sidebar';
import { API_BASE_URL, clearAdminSession, getAdminToken, verifyAdminSession } from '@/lib/auth';

type Item = {
  id: string;
  reason?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  requestedBy: { id: string; firstName?: string | null; lastName?: string | null; phone: string; email?: string | null; isActive: boolean };
};

async function api(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  if (!token) throw new Error('SESSION_EXPIRED');
  const r = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error('SESSION_EXPIRED');
  if (!r.ok) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
}

export default function AccountDeleteRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!await verifyAdminSession()) { router.replace('/login'); return; }
      const data = await api('/admin/account-delete-requests');
      setItems(data.items || []);
    } catch (e) {
      if (e instanceof Error && e.message === 'SESSION_EXPIRED') { clearAdminSession(); router.replace('/login'); return; }
      setError(e instanceof Error ? e.message : 'Requests load failed');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function review(item: Item, action: 'approve' | 'reject') {
    const label = action === 'approve' ? 'approve करके account data remove' : 'reject';
    if (!window.confirm(`${item.requestedBy.firstName || item.requestedBy.phone} की request ${label} करें?`)) return;
    setBusy(item.id); setError(null);
    try {
      await api(`/admin/account-delete-requests/${item.id}/${action}`, { method: 'POST', body: JSON.stringify({}) });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
    finally { setBusy(null); }
  }

  const pending = items.filter(i => i.status === 'PENDING');
  const reviewed = items.filter(i => i.status !== 'PENDING');

  return <div className="admin-shell"><AdminSidebar/><main className="main moderation-page">
    <div className="moderation-top"><div><p className="eyebrow">ACCOUNT PRIVACY</p><h1>Account Delete Requests</h1><p className="subtitle">Members के Damodar Prayas account deletion requests review करें।</p></div><button className="small-btn" onClick={() => void load()}>Refresh</button></div>
    {error ? <div className="moderation-error">{error}</div> : null}
    {loading ? <div className="empty-state">Requests load हो रही हैं…</div> : <>
      <h2>Pending ({pending.length})</h2>
      <section className="moderation-list">{pending.length === 0 ? <div className="empty-state">कोई pending request नहीं है।</div> : pending.map(item => {
        const name = [item.requestedBy.firstName, item.requestedBy.lastName].filter(Boolean).join(' ') || 'Member';
        return <article className="moderation-card" key={item.id}><span className="danger-label">PENDING</span><h2>{name}</h2><p>{item.requestedBy.phone}{item.requestedBy.email ? ` • ${item.requestedBy.email}` : ''}</p><small>Requested {new Date(item.createdAt).toLocaleString('en-IN')}</small>{item.reason ? <div className="reason-box"><b>Reason</b><p>{item.reason}</p></div> : null}<div className="moderation-actions"><button disabled={busy === item.id} className="reject-action" onClick={() => void review(item, 'reject')}>Reject</button><button disabled={busy === item.id} className="approve-action" onClick={() => void review(item, 'approve')}>{busy === item.id ? 'Working…' : 'Approve & Delete Account'}</button></div></article>;
      })}</section>
      <h2 style={{marginTop:28}}>Reviewed</h2>
      <section className="moderation-list">{reviewed.length === 0 ? <div className="empty-state">अभी कोई reviewed request नहीं है।</div> : reviewed.map(item => <article className="moderation-card" key={item.id}><span className="danger-label">{item.status}</span><h2>{[item.requestedBy.firstName,item.requestedBy.lastName].filter(Boolean).join(' ') || 'Deleted member'}</h2><p>Requested {new Date(item.createdAt).toLocaleDateString('en-IN')}</p></article>)}</section>
    </>}
  </main></div>;
}
