'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/auth';

export default function SetupPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('8839817483');
  const [setupSecret, setSetupSecret] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (password !== confirmPassword) { setError('Passwords match नहीं कर रहे।'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/setup-password`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ phone: phone.trim(), setupSecret, password }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message ?? 'Password setup failed.');
      setSuccess('Password set हो गया। अब Render से ADMIN_SETUP_SECRET remove करें और login करें।');
      setTimeout(() => router.push('/login'), 1800);
    } catch (err) { setError(err instanceof Error ? err.message : 'Password setup failed.'); }
    finally { setLoading(false); }
  }

  return <main className="login-page">
    <section className="login-brand-panel"><div className="login-brand-inner"><div className="login-seal">DP</div><p className="login-kicker">ONE-TIME ADMIN SETUP</p><h1>दामोदर प्रयास</h1><p className="login-brand-subtitle">Secure administrator bootstrap</p><div className="gold-rule"/><h2>पहला Admin Password</h2><p className="login-copy">यह screen केवल initial admin password बनाने के लिए है। Password बनते ही setup code server से हटा दें।</p></div></section>
    <section className="login-form-panel"><div className="login-card"><div className="mobile-seal">DP</div><p className="eyebrow">SECURE ONE-TIME SETUP</p><h2>Set Admin Password</h2><p className="login-help">Render में रखा temporary setup code और अपना नया password डालें।</p>
      <form onSubmit={submit} className="login-form">
        <label><span>Admin mobile number</span><div className="field-wrap"><input inputMode="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} required /></div></label>
        <label><span>Temporary setup code</span><div className="field-wrap"><input type="password" value={setupSecret} onChange={(e)=>setSetupSecret(e.target.value)} required /></div></label>
        <label><span>New password</span><div className="field-wrap"><input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} minLength={8} required /></div></label>
        <label><span>Confirm password</span><div className="field-wrap"><input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} minLength={8} required /></div></label>
        {error ? <div className="login-error">{error}</div> : null}{success ? <div className="notice"><div><b>{success}</b></div></div> : null}
        <button className="login-submit" disabled={loading} type="submit">{loading ? 'Setting password…' : 'Create Admin Password'}<span>→</span></button>
      </form>
      <p className="login-security">Password में कम से कम 8 characters, एक letter और एक number होना चाहिए।</p>
    </div></section>
  </main>;
}
