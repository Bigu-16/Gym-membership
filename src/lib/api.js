const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

const TOKEN_KEY = 'tkd_token';
const CLUB_KEY = 'tkd_club';

const storage = {
  get(store, key) {
    try { return store.getItem(key); } catch { return null; }
  },
  set(store, key, value) {
    try {
      if (value === null || value === undefined) store.removeItem(key);
      else store.setItem(key, String(value));
    } catch { /* storage unavailable (private mode): keep working in memory */ }
  },
};

let token = storage.get(window.sessionStorage, TOKEN_KEY);
let clubId = storage.get(window.localStorage, CLUB_KEY);
let onUnauthenticated = () => {};

export const session = {
  get token() { return token; },
  setToken(value) { token = value; storage.set(window.sessionStorage, TOKEN_KEY, value); },
  get clubId() { return clubId ? Number(clubId) : null; },
  setClubId(value) { clubId = value ? String(value) : null; storage.set(window.localStorage, CLUB_KEY, clubId); },
  onUnauthenticated(handler) { onUnauthenticated = handler; },
};

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

const describe = (data, fallback) => {
  const detail = data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (detail.message) return detail.message;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body' && typeof p === 'string').join(' › ') : '';
        const msg = String(item.msg || '').replace(/^Value error, /, '');
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }
  return fallback;
};

export const request = async (path, { method = 'GET', body, query, form } = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v);
  });
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (clubId) headers['X-Club-Id'] = clubId;
  let payload;
  if (form) {
    payload = new URLSearchParams(form);
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }
  let response;
  try {
    response = await fetch(url.toString(), { method, headers, body: payload });
  } catch {
    throw new ApiError('network', 0);
  }
  if (response.status === 401 && !path.startsWith('/auth/login')) {
    onUnauthenticated();
    throw new ApiError('Unauthenticated', 401);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(describe(data, `Request failed (${response.status})`), response.status, data?.detail);
  return data;
};

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', form: { username: email, password } }),
  me: () => request('/auth/me'),
  changePassword: (body) => request('/auth/change-password', { method: 'POST', body }),

  clubs: () => request('/clubs'),
  createClub: (body) => request('/clubs', { method: 'POST', body }),
  club: () => request('/clubs/current'),
  updateClub: (body) => request('/clubs/current', { method: 'PATCH', body }),
  slots: () => request('/slots'),
  createSlot: (body) => request('/slots', { method: 'POST', body }),
  updateSlot: (id, body) => request(`/slots/${id}`, { method: 'PUT', body }),
  deleteSlot: (id) => request(`/slots/${id}`, { method: 'DELETE' }),

  dashboard: () => request('/dashboard'),
  students: (query) => request('/students', { query }),
  student: (id) => request(`/students/${id}`),
  updateStudent: (id, body) => request(`/students/${id}`, { method: 'PATCH', body }),
  guardians: (search) => request('/guardians', { query: { search } }),
  guardian: (id) => request(`/guardians/${id}`),
  guardianByPhone: (phone) => request('/guardians/by-phone', { query: { phone } }),
  updateGuardian: (id, body) => request(`/guardians/${id}`, { method: 'PATCH', body }),
  enrol: (body) => request('/enrolments', { method: 'POST', body }),
  renew: (body) => request('/fees/renew', { method: 'POST', body }),
  fees: (query) => request('/fees', { query }),
  voidFee: (id) => request(`/fees/${id}`, { method: 'DELETE' }),

  sizes: () => request('/uniforms/sizes'),
  addSize: (body) => request('/uniforms/sizes', { method: 'POST', body }),
  updateSize: (id, body) => request(`/uniforms/sizes/${id}`, { method: 'PATCH', body }),
  orders: () => request('/uniforms/orders'),
  createOrder: (body) => request('/uniforms/orders', { method: 'POST', body }),
  receiveOrder: (id, body = {}) => request(`/uniforms/orders/${id}/receive`, { method: 'POST', body }),
  cancelOrder: (id) => request(`/uniforms/orders/${id}/cancel`, { method: 'POST' }),
  sales: (query) => request('/uniforms/sales', { query }),
  sell: (body) => request('/uniforms/sales', { method: 'POST', body }),
  voidSale: (id) => request(`/uniforms/sales/${id}`, { method: 'DELETE' }),
  stockCount: (body) => request('/uniforms/stock-count', { method: 'POST', body }),

  register: (day, slotId) => request('/attendance/register', { query: { day, slot_id: slotId } }),
  saveRegister: (body) => request('/attendance/register', { method: 'PUT', body }),
  attendanceReport: (query) => request('/reports/attendance', { query }),
  moneyReport: (query) => request('/reports/money', { query }),

  users: () => request('/users/'),
  createUser: (body) => request('/users/', { method: 'POST', body }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PATCH', body }),
  resetPassword: (id, password) => request(`/users/${id}/password`, { method: 'PATCH', body: { password } }),

  reportClientError: (body) => request('/client-errors/', { method: 'POST', body }).catch(() => null),
};
