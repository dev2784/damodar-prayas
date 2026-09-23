import { env } from '../../config/env.js';

/** Verify MSG91 widget access token server-side. Fail closed on missing/malformed responses. */
export async function verifyMsg91Phone(accessToken: string, expectedPhone: string): Promise<boolean> {
  if (env.OTP_PROVIDER !== 'msg91' || !env.MSG91_AUTH_KEY || !accessToken) return false;
  try {
    const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ authkey: env.MSG91_AUTH_KEY, 'access-token': accessToken }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return false;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== 'object') return false;
    const result = payload as Record<string, unknown>;
    // MSG91 responses may differ by widget configuration. Require explicit
    // success AND a server-returned mobile identifier matching the input.
    const data = result.data && typeof result.data === 'object'
      ? result.data as Record<string, unknown> : {};
    const verified = result.type === 'success' || result.status === 'success';
    const returnedPhone = data.mobile ?? data.identifier ?? result.mobile ?? result.identifier;
    if (!verified || typeof returnedPhone !== 'string') return false;
    const digits = (value: string) => value.replace(/\D/g, '');
    const actual = digits(returnedPhone);
    const expected = digits(expectedPhone);
    return actual === expected || (expected.length === 12 && expected.startsWith('91') && actual === expected.slice(2));
  } catch {
    return false;
  }
}
