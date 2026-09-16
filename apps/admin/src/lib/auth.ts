export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://damodar-prayas-api.onrender.com/api/v1';

const TOKEN_KEY = 'damodar_admin_token';
const USER_KEY = 'damodar_admin_user';

export type AdminUser = {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
};

export function saveAdminSession(token: string, user: AdminUser) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function loginAdmin(phone: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ phone: phone.trim(), password }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message ?? 'Login failed. Please check your credentials.');
  }

  if (data?.user?.role !== 'ADMIN' && data?.user?.role !== 'SUPER_ADMIN') {
    throw new Error('This account does not have administrator access.');
  }

  saveAdminSession(data.accessToken, data.user);
  return data.user as AdminUser;
}

export async function verifyAdminSession() {
  const token = getAdminToken();
  if (!token) return null;

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  });

  if (!response.ok) {
    clearAdminSession();
    return null;
  }

  const data = await response.json();
  if (data?.user?.role !== 'ADMIN' && data?.user?.role !== 'SUPER_ADMIN') {
    clearAdminSession();
    return null;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user as AdminUser;
}
