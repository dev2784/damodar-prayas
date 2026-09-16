'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken, loginAdmin, verifyAdminSession } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      if (!getAdminToken()) {
        if (active) setChecking(false);
        return;
      }
      const user = await verifyAdminSession().catch(() => null);
      if (!active) return;
      if (user) router.replace('/');
      else setChecking(false);
    }
    void checkSession();
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(phone, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <main className="login-loading">दामोदर प्रयास Admin खोल रहे हैं…</main>;
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-inner">
          <div className="login-seal">DP</div>
          <p className="login-kicker">DARZI SAMAJ • ADMINISTRATION</p>
          <h1>दामोदर प्रयास</h1>
          <p className="login-brand-subtitle">Community & Matrimony Administration</p>
          <div className="gold-rule" />
          <h2>विश्वास के साथ<br />समाज का संचालन</h2>
          <p className="login-copy">Matrimony profiles, समितियाँ, community posts और advertisements को एक सुरक्षित approval workflow से manage करें।</p>
          <div className="login-principles">
            <span>✓ Approval-first moderation</span>
            <span>✓ Authorized admin access</span>
            <span>✓ Community data protection</span>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="mobile-seal">DP</div>
          <p className="eyebrow">SECURE ADMIN PORTAL</p>
          <h2>Admin Login</h2>
          <p className="login-help">अपने authorized mobile number और password से sign in करें।</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Mobile number</span>
              <div className="field-wrap"><span className="field-icon">☎</span><input autoComplete="username" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 8839817483" required /></div>
            </label>
            <label>
              <span>Password</span>
              <div className="field-wrap"><span className="field-icon">◆</span><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /><button className="show-password" type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide' : 'Show'}</button></div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
              <Link href="/setup-password" style={{ color: '#7b1f2d', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <button className="login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in to Admin Portal'}<span>→</span></button>
          </form>

          <p className="login-security">🔒 केवल ADMIN role वाले accounts को dashboard access मिलेगा।</p>
        </div>
        <p className="login-footer">Damodar Prayas • Darzi Samaj Community Platform</p>
      </section>
    </main>
  );
}
