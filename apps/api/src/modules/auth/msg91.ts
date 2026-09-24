import { env } from '../../config/env.js';


type Msg91Payload = Record<string, unknown>;

function readIdentifier(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of ['identifier', 'mobile', 'phone', 'number', 'mobileNumber', 'phoneNumber']) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  for (const key of ['data', 'message', 'details', 'user']) {
    const nested = readIdentifier(record[key]);
    if (nested) return nested;
  }
  return null;
}

function digits(value: string) { return value.replace(/\D/g, ''); }

export type Msg91AccessTokenResult =
  | { verified: true }
  | { verified: false; reason: 'not_configured' | 'http_error' | 'provider_rejected' | 'phone_missing' | 'phone_mismatch' | 'request_error'; httpStatus?: number; responseType?: string; responseKeys?: string[] };

export async function verifyAccessToken(accessToken: string, expectedPhone: string): Promise<Msg91AccessTokenResult> {
  if (env.OTP_PROVIDER !== 'msg91' || !env.MSG91_AUTH_KEY || !env.MSG91_WIDGET_ID) return { verified: false, reason: 'not_configured' };
  try {
    const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ authkey: env.MSG91_AUTH_KEY, 'access-token': accessToken }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { verified: false, reason: 'http_error', httpStatus: response.status };

    const payload = await response.json() as Msg91Payload;
    const type = String(payload.type ?? payload.status ?? '').toLowerCase();
    const responseKeys = Object.keys(payload);
    if (type !== 'success') return { verified: false, reason: 'provider_rejected', httpStatus: response.status, responseType: type || 'missing', responseKeys };
    const verifiedPhone = readIdentifier(payload);
    if (!verifiedPhone) return { verified: false, reason: 'phone_missing', httpStatus: response.status, responseType: type, responseKeys };
    const expected = digits(expectedPhone);
    const actual = digits(verifiedPhone);
    const expectedLocal = expected.length === 12 && expected.startsWith('91') ? expected.slice(2) : expected;
    const actualLocal = actual.length === 12 && actual.startsWith('91') ? actual.slice(2) : actual;
    const matched = actual === expected || (expectedLocal.length === 10 && actualLocal === expectedLocal);
    return matched
      ? { verified: true }
      : { verified: false, reason: 'phone_mismatch', httpStatus: response.status, responseType: type, responseKeys };
  } catch {
    return { verified: false, reason: 'request_error' };
  }
}

export async function verifyMsg91Phone(accessToken: string, expectedPhone: string): Promise<boolean> {
  return (await verifyAccessToken(accessToken, expectedPhone)).verified;
}
