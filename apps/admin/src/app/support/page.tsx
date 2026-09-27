'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin-sidebar';
import { API_BASE_URL, clearAdminSession, getAdminToken } from '@/lib/auth';
import styles from './support.module.css';

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
type Category = 'FEEDBACK' | 'COMPLAINT' | 'CONTACT';
type Ticket = {
  id: string; category: Category; status: Status; subject: string; message: string;
  adminNote: string; createdAt: string; updatedAt: string;
  user: { id: string; firstName: string | null; lastName: string | null; phone: string; email: string | null } | null;
};
const statusLabels: Record<Status, string> = { OPEN: 'New / नया', IN_PROGRESS: 'In progress / कार्य जारी', RESOLVED: 'Resolved / समाधान हुआ' };
const categoryLabels: Record<Category, string> = { FEEDBACK: 'Feedback / सुझाव', COMPLAINT: 'Complaint / शिकायत', CONTACT: 'Contact / संपर्क' };
function date(value: string) { return new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }); }

function TicketCard({ ticket, save, busy }: { ticket: Ticket; save: (ticket: Ticket, status: Status, adminNote: string) => Promise<void>; busy: boolean }) {
  const [status, setStatus] = useState(ticket.status);
  const [note, setNote] = useState(ticket.adminNote);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  async function submit() {
    setError(''); setSaved(false);
    try { await save(ticket, status, note); setSaved(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save'); }
  }
  return <article className={styles.ticket}>
    <div className={styles.row}><span className={styles.badge}>{categoryLabels[ticket.category]}</span><span>{date(ticket.createdAt)} IST</span></div>
    <h2>{ticket.subject}</h2><p className={styles.message}>{ticket.message}</p>
    <div className={styles.identity}>
      <strong>{ticket.user ? [ticket.user.firstName, ticket.user.lastName].filter(Boolean).join(' ') || 'Community member' : 'Account deleted / unavailable'}</strong>
      {ticket.user ? <><span>Phone: {ticket.user.phone || 'Not available'}</span><span>Email: {ticket.user.email || 'Not provided'}</span><small>User ID: {ticket.user.id}</small></> : null}
      <small>Reference: {ticket.id}</small>
    </div>
    <div className={styles.controls}>
      <label>Status<select value={status} disabled={busy} onChange={(e) => { setStatus(e.target.value as Status); setSaved(false); }}>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Private admin note<textarea value={note} disabled={busy} maxLength={4000} rows={3} onChange={(e) => { setNote(e.target.value); setSaved(false); }} placeholder="Internal follow-up notes; not sent to the user" /></label>
    </div>
    <div className={styles.row}><small>Updated: {date(ticket.updatedAt)} IST</small><button disabled={busy || (status === ticket.status && note === ticket.adminNote)} onClick={() => void submit()}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    {saved ? <p role="status" className={styles.success}>Saved.</p> : null}
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
  </article>;
}

export default function SupportInbox() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [items, setItems] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = getAdminToken();
    if (!token) { router.replace('/login'); return; }
    setLoading(true); setError('');
    const query = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) query.set('status', status);
    if (category) query.set('category', category);
    void fetch(`${API_BASE_URL}/admin/support?${query}`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { clearAdminSession(); router.replace('/login'); throw new Error('Admin login required'); }
        if (!response.ok) throw new Error('Could not load messages. Please retry.');
        return response.json();
      }).then((data) => { if (!controller.signal.aborted) { setItems(data.items); setPagination(data.pagination); } })
      .catch((e) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Could not load messages'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [router, status, category, page, refresh]);

  async function save(ticket: Ticket, nextStatus: Status, adminNote: string) {
    if (saving.current) throw new Error('Please wait for the current save.');
    saving.current = true; setBusy(true);
    try {
      const token = getAdminToken();
      if (!token) { router.replace('/login'); throw new Error('Admin login required'); }
      const response = await fetch(`${API_BASE_URL}/admin/support/${encodeURIComponent(ticket.id)}`, { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ status: nextStatus, adminNote }) });
      if (response.status === 401 || response.status === 403) { clearAdminSession(); router.replace('/login'); throw new Error('Admin login required'); }
      if (!response.ok) throw new Error('Changes were not saved. Please retry.');
      const result = await response.json();
      setItems((current) => current.map((item) => item.id === ticket.id ? { ...item, ...result.ticket, user: item.user } : item));
      // Refresh a filtered list when a ticket no longer belongs to that status.
      if (status && nextStatus !== status) { setPage(1); setRefresh((value) => value + 1); }
    } finally { saving.current = false; setBusy(false); }
  }

  return <div className="admin-shell"><AdminSidebar /><main className={`main ${styles.page}`}>
    <div className={styles.row}><div><p className={styles.eyebrow}>MEMBER SUPPORT</p><h1>Feedback & complaints</h1><p>सुझाव, शिकायत और संपर्क संदेश — account details के साथ।</p></div><button disabled={busy || loading} onClick={() => setRefresh((value) => value + 1)}>Refresh</button></div>
    <div className={styles.filters}>
      <label>Status<select disabled={busy} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{Object.entries(statusLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <label>Category<select disabled={busy} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{Object.entries(categoryLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <span>{pagination.total} messages · newest first</span>
    </div>
    {loading ? <p role="status">Loading messages…</p> : error ? <p role="alert" className={styles.error}>{error}</p> : items.length ? items.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} save={save} busy={busy} />) : <div className={styles.empty}>अभी कोई संदेश नहीं मिला। / No messages found.</div>}
    {!loading && !error && pagination.totalPages > 1 ? <div className={styles.row}><button disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} / {pagination.totalPages}</span><button disabled={page >= pagination.totalPages || busy} onClick={() => setPage(page + 1)}>Next →</button></div> : null}
  </main></div>;
}
