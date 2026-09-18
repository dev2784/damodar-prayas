const ACCESS_TOKEN_KEY = 'damodar_prayas_access_token';

// SecureStore is native-only. Web sessions are limited to the current browser tab.
export async function getAccessToken(): Promise<string | null> {
  return typeof window === 'undefined' ? null : window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function saveAccessToken(token: string): Promise<void> {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken(): Promise<void> {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
