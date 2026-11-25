// Which app to open: decided by the signed-in account's tenant, never chosen by the user.
import { API_BASE_URL } from './apiBase';

const KIND_KEY = 'app_kind';
const TOKEN_KEY = 'gym_api_token';

const read = (store, key) => {
  try { return store.getItem(key); } catch { return null; }
};

export const rememberedAppKind = () => (read(window.localStorage, KIND_KEY) === 'taekwondo' ? 'taekwondo' : 'gym');

/** 'gym' | 'taekwondo' for the signed-in account, or null when nobody is signed in. */
export async function appKindFromServer() {
  const token = read(window.sessionStorage, TOKEN_KEY);
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const me = await response.json();
    const kind = me.club_kind === 'taekwondo' ? 'taekwondo' : 'gym';
    try { window.localStorage.setItem(KIND_KEY, kind); } catch { /* ignore */ }
    return kind;
  } catch {
    return null; // offline: fall back to the remembered app, which shows its own error
  }
}

/** After a sign-in or sign-out, start again so the right tenant's app opens. */
export const reopenForAccount = () => window.location.reload();
