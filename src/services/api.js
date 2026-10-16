import { toDateKey, parseTimeRange, clockToString } from '../utils/classSessions';

const DEFAULT_API_BASE_URL = 'https://gym-membership-f3ua.onrender.com/api/v1';

// A URL saved from the login screen wins, then the build-time env, then production.
const getInitialBaseUrl = () => {
  let stored = null;
  try {
    stored = localStorage.getItem('gym_api_base_url');
  } catch {
    // Storage can be unavailable (private mode); fall back to the env.
  }
  return stored || import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = getInitialBaseUrl();

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' && window.sessionStorage
    ? sessionStorage.getItem('gym_api_token')
    : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const describeError = (data, fallback) => {
  const detail = data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== 'body').join(' › ') : '';
        const message = String(item.msg || '').replace(/^Value error, /, '');
        return field ? `${field}: ${message}` : message;
      })
      .join('; ');
  }
  return fallback;
};

// Single fetch wrapper: JSON in/out, readable errors, 401 surfaced for logout.
const request = async (path, { method = 'GET', body, fallbackError = 'Request failed', query } = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.append(key, value);
  });
  const response = await fetch(url.toString(), {
    method,
    headers: getAuthHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (response.status === 401) {
    throw new Error('Unauthenticated');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    let message = describeError(data, fallbackError);
    // Server errors carry an id that matches the server log, so problems can be traced.
    const requestId = data?.request_id || response.headers?.get?.('X-Request-ID');
    if (response.status >= 500 && requestId) message = `${message} (Error ID: ${requestId})`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
};

// A server that predates these endpoints answers 404/405; say so plainly.
const explainOutdatedServer = (err) => {
  if (err.status === 404 || err.status === 405) {
    throw new Error('The server is running an older version. Deploy the latest backend and try again — the deploy also loads the official classes and packages automatically.');
  }
  throw err;
};

// Day name conversion helpers
const SHORT_TO_FULL_DAYS = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday'
};

const FULL_TO_SHORT_DAYS = Object.fromEntries(Object.entries(SHORT_TO_FULL_DAYS).map(([short, full]) => [full, short]));

const mapDaysToBackend = (days) => {
  if (!days) return [];
  const list = Array.isArray(days) ? days : String(days).split(',');
  return list.map((d) => d.trim()).filter(Boolean).map((d) => SHORT_TO_FULL_DAYS[d] || d);
};

const mapDaysToFrontend = (daysList) => {
  if (!daysList || !Array.isArray(daysList)) return '';
  return daysList.map((d) => FULL_TO_SHORT_DAYS[d] || d).join(', ');
};

const capitalize = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : null);

export const avatarFor = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Member')}&background=random&color=fff`;

// Map member to frontend schema
export const mapMemberToFrontend = (m) => ({
  id: m.id,
  name: m.name,
  phone: m.phone || null,
  whatsappNumber: m.whatsapp_number ?? m.whatsappNumber ?? null,
  emiratesId: m.emirates_id ?? m.emiratesId ?? null,
  email: m.email || null,
  parentPhone: m.parent_phone || m.parentPhone || null,
  parentName: m.parent_name || m.parentName || null,
  familyId: m.family_id ?? m.familyId ?? null,
  gender: capitalize(m.gender),
  age: m.age ?? null,
  medicalIssues: m.medical_issues || m.medicalIssues || '',
  planId: m.plan_id ?? m.planId ?? null,
  // Resolved against the real package list in useGymData.
  plan: m.plan_name || m.plan || null,
  expiryDate: m.expiry_date || m.expiryDate || null,
  isFrozen: m.is_frozen ?? m.isFrozen ?? false,
  image: m.image || avatarFor(m.name),
  messagingOptIn: m.messaging_opt_in ?? m.messagingOptIn ?? true,
  termsAcceptedAt: m.terms_accepted_at ?? m.termsAcceptedAt ?? null,
  createdAt: m.created_at || m.createdAt || null
});

const blankToNull = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
};

const toDateOnly = (value) => {
  if (!value) return value === undefined ? undefined : null;
  if (value instanceof Date) return toDateKey(value);
  return String(value).split('T')[0];
};

// Map member to backend schema. Only fields that are present are sent, so a partial
// edit never overwrites age, plan or expiry with defaults.
export const mapMemberToBackend = (m) => {
  const payload = {
    name: m.name !== undefined ? m.name.trim() : undefined,
    phone: blankToNull(m.phone),
    whatsapp_number: blankToNull(m.whatsappNumber),
    emirates_id: blankToNull(m.emiratesId),
    email: blankToNull(m.email),
    parent_phone: blankToNull(m.parentPhone),
    gender: m.gender ? m.gender.toLowerCase() : m.gender === null ? null : undefined,
    age: m.age !== undefined && m.age !== null && m.age !== '' ? parseInt(m.age, 10) : undefined,
    medical_issues: m.medicalIssues !== undefined ? blankToNull(m.medicalIssues) : undefined,
    plan_id: m.planId !== undefined ? (m.planId ? Number(m.planId) : null) : undefined,
    expiry_date: toDateOnly(m.expiryDate),
    messaging_opt_in: m.messagingOptIn,
    is_frozen: m.isFrozen,
    terms_accepted: m.termsAccepted
  };
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
};

const mapPaymentToBackend = (payment) => {
  if (!payment || payment.amount === undefined || payment.amount === null || payment.amount === '') return undefined;
  return {
    amount: Number(payment.amount),
    method: payment.method || 'cash',
    currency: payment.currency || 'AED',
    ...(payment.note ? { note: payment.note } : {})
  };
};

export const mapTemplateToFrontend = (t) => ({
  id: t.id,
  className: t.title,
  type: t.type,
  days: mapDaysToFrontend(t.days),
  time: t.time,
  capacity: t.capacity,
  trainer: t.trainer_name || null,
  enrolled: 0
});

const parseLocalDate = (dateStr) => {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const normalizeChecklist = (raw) => {
  const list = Array.isArray(raw) ? raw : (raw?.items || []);
  return list.map((item, idx) => ({
    id: item.id !== undefined && item.id !== null ? item.id : idx + 1,
    text: item.text || '',
    checked: Boolean(item.checked)
  }));
};

const fromBackendStatus = (status) => (status === 'in_progress' ? 'in-progress' : status);
const toBackendStatus = (status) => (status === 'in-progress' ? 'in_progress' : status);

// Map a recorded session. Its clock comes from the session itself, then its class slot.
export const mapSessionToFrontend = (s, templates = []) => {
  const template = Array.isArray(templates) ? templates.find((t) => t.id === s.template_id) : null;
  const range = parseTimeRange(
    s.start_time ? `${s.start_time}${s.end_time ? ` - ${s.end_time}` : ''}` : template?.time
  );
  const start = parseLocalDate(s.date);
  start.setHours(range.start.hours, range.start.minutes, 0, 0);
  const end = parseLocalDate(s.date);
  end.setHours(range.end.hours, range.end.minutes, 0, 0);

  return {
    id: s.id,
    templateId: s.template_id ?? null,
    dateKey: s.date,
    title: template ? template.className : 'Class (removed from timetable)',
    trainer: s.trainer_name,
    start,
    end,
    status: fromBackendStatus(s.status),
    type: 'group',
    capacity: template?.capacity ?? null,
    checklist: normalizeChecklist(s.checklist_data),
    isProjected: false
  };
};

export const apiService = {
  // Auth API
  async login(email, password) {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(describeError(data, 'Login failed'));
    }

    sessionStorage.setItem('gym_api_token', data.access_token);
    return data.access_token;
  },

  logout() {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem('gym_api_token');
    }
  },

  async getMe() {
    return request('/auth/me', { fallbackError: 'Unauthenticated' });
  },

  /** Change your own password; all other logins of this account are signed out. */
  async changePassword(currentPassword, newPassword) {
    const data = await request('/auth/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
      fallbackError: 'Could not change the password'
    });
    sessionStorage.setItem('gym_api_token', data.access_token);
    return true;
  },

  async logoutEverywhere() {
    await request('/auth/logout-all', { method: 'POST', fallbackError: 'Could not sign out other devices' });
    this.logout();
  },

  async getAuditLogs(params = {}) {
    return request('/audit-logs/', { query: params, fallbackError: 'Failed to load the activity log' });
  },

  /** Best-effort crash report from the error boundary; never throws. */
  async reportClientError(report) {
    try {
      await request('/client-errors/', { method: 'POST', body: report, fallbackError: 'report failed' });
    } catch {
      // Reporting must never cause a second error.
    }
  },

  // Members API
  async getMembers(params = {}) {
    const data = await request('/members/', { query: params, fallbackError: 'Failed to load members' });
    return data.map(mapMemberToFrontend);
  },

  async getMember(memberId) {
    const data = await request(`/members/${memberId}`, { fallbackError: 'Failed to load member details' });
    return mapMemberToFrontend(data);
  },

  async getFamilies(parentPhone = null) {
    const data = await request('/members/families', {
      query: { parent_phone: parentPhone },
      fallbackError: 'Failed to load families'
    });
    return data.map((f) => ({
      id: f.id,
      parentName: f.parent?.name || null,
      parentPhone: f.parent?.phone || null,
      parentEmail: f.parent?.email || null,
      members: (f.members || []).map((m) => mapMemberToFrontend({ ...m, parent_name: f.parent?.name }))
    }));
  },

  /**
   * Register trainees. Children with a parent/guardian go through the family endpoint
   * (which also adds to an existing family); adults register individually.
   * Each trainee may carry `payment` ({ amount, method }).
   */
  async enrollMembers(membersList, parent = null) {
    if (!membersList || membersList.length === 0) return [];

    if (parent?.phone) {
      const data = await request('/members/families', {
        method: 'POST',
        fallbackError: 'Family registration failed',
        body: {
          parent: {
            name: parent.name,
            phone: parent.phone,
            ...(parent.email ? { email: parent.email } : {})
          },
          members: membersList.map((m) => ({
            ...mapMemberToBackend({ ...m, parentPhone: undefined }),
            ...(mapPaymentToBackend(m.payment) ? { payment: mapPaymentToBackend(m.payment) } : {})
          }))
        }
      });
      return (data.members || []).map((m) => mapMemberToFrontend({ ...m, parent_name: data.parent?.name }));
    }

    const created = [];
    for (const m of membersList) {
      const data = await request('/members/', {
        method: 'POST',
        fallbackError: 'Member registration failed',
        body: {
          ...mapMemberToBackend(m),
          ...(mapPaymentToBackend(m.payment) ? { payment: mapPaymentToBackend(m.payment) } : {})
        }
      });
      created.push(mapMemberToFrontend(data));
    }
    return created;
  },

  async updateMember(memberId, memberData) {
    const data = await request(`/members/${memberId}`, {
      method: 'PUT',
      body: mapMemberToBackend(memberData),
      fallbackError: 'Failed to update member'
    });
    return mapMemberToFrontend({ ...data, parent_name: memberData.parentName });
  },

  async renewMember(memberId, { planId, startFrom = 'expiry', payment } = {}) {
    const data = await request(`/members/${memberId}/renew`, {
      method: 'POST',
      fallbackError: 'Failed to renew membership',
      body: {
        ...(planId ? { plan_id: Number(planId) } : {}),
        start_from: startFrom,
        ...(mapPaymentToBackend(payment) ? { payment: mapPaymentToBackend(payment) } : {})
      }
    });
    return mapMemberToFrontend(data);
  },

  async freezeMember(memberId, isFrozen) {
    const data = await request(`/members/${memberId}/freeze`, {
      method: 'PATCH',
      body: { is_frozen: isFrozen },
      fallbackError: 'Failed to update freeze status'
    });
    return mapMemberToFrontend(data);
  },

  async freezeFamily(familyKey, isFrozen) {
    const data = await request(`/members/families/${encodeURIComponent(familyKey)}/freeze`, {
      method: 'PATCH',
      body: { is_frozen: isFrozen },
      fallbackError: 'Failed to update family freeze status'
    });
    // The endpoint returns the family group, not a bare list.
    return (data.members || []).map((m) => mapMemberToFrontend({ ...m, parent_name: data.parent?.name }));
  },

  async deleteMember(memberId) {
    await request(`/members/${memberId}`, { method: 'DELETE', fallbackError: 'Failed to delete member' });
    return true;
  },

  // Payments API
  async getPayments(params = {}) {
    return request('/payments/', { query: params, fallbackError: 'Failed to load payments' });
  },

  // Dashboard API
  async getActiveCheckIns() {
    return request('/dashboard/active-members', { fallbackError: 'Failed to load active check-ins' });
  },

  async getDashboardStats() {
    return request('/dashboard/stats', { fallbackError: 'Failed to load dashboard stats' });
  },

  async getRecentActivities(limit = 10) {
    return request('/dashboard/recent-activities', { query: { limit }, fallbackError: 'Failed to load recent activities' });
  },

  async checkInMember(memberId, { override = false } = {}) {
    return request('/check-ins/', {
      method: 'POST',
      body: { member_id: memberId, ...(override ? { override: true } : {}) },
      fallbackError: 'Check-in failed'
    });
  },

  async checkOutMember(memberId) {
    const open = await request('/check-ins/', {
      query: { member_id: memberId, open_only: true },
      fallbackError: 'Checkout failed'
    });
    const active = open[0];
    if (!active) {
      throw new Error('Member is not checked in');
    }
    return request(`/check-ins/${active.id}/check-out`, { method: 'PATCH', body: {}, fallbackError: 'Checkout failed' });
  },

  // Schedule templates API
  async getTemplates() {
    const data = await request('/schedule/templates', { fallbackError: 'Failed to load schedule templates' });
    return data.map(mapTemplateToFrontend);
  },

  async createTemplate(templateData) {
    const t = await request('/schedule/templates', {
      method: 'POST',
      fallbackError: 'Failed to create class template',
      body: {
        title: templateData.className,
        type: templateData.type || 'group',
        days: mapDaysToBackend(templateData.days),
        time: templateData.time,
        capacity: templateData.capacity ? Number(templateData.capacity) : null,
        ...(templateData.trainer ? { trainer_name: templateData.trainer } : {})
      }
    });
    return mapTemplateToFrontend(t);
  },

  async updateTemplate(templateId, templateData) {
    const payload = {};
    if (templateData.className !== undefined) payload.title = templateData.className;
    if (templateData.type !== undefined) payload.type = templateData.type;
    if (templateData.days !== undefined) payload.days = mapDaysToBackend(templateData.days);
    if (templateData.time !== undefined) payload.time = templateData.time;
    if (templateData.capacity !== undefined) payload.capacity = templateData.capacity ? Number(templateData.capacity) : null;
    if (templateData.trainer !== undefined) payload.trainer_name = templateData.trainer || null;

    const t = await request(`/schedule/templates/${templateId}`, {
      method: 'PATCH',
      body: payload,
      fallbackError: 'Failed to update class template'
    });
    return { ...mapTemplateToFrontend(t), enrolled: templateData.enrolled || 0 };
  },

  async deleteTemplate(templateId) {
    await request(`/schedule/templates/${templateId}`, { method: 'DELETE', fallbackError: 'Failed to delete class template' });
    return true;
  },

  async loadOfficialTimetable() {
    return request('/schedule/templates/sync-official', { method: 'POST', fallbackError: 'Failed to load the official timetable' })
      .catch(explainOutdatedServer);
  },

  // Sessions API
  async getSessions(templates, params = {}) {
    const data = await request('/schedule/sessions', { query: params, fallbackError: 'Failed to load sessions' });
    return data.map((s) => mapSessionToFrontend(s, templates));
  },

  /**
   * Persist a session. For a class slot (templateId + date) the backend returns the
   * existing session for that day if there is one, so this never creates duplicates.
   */
  async saveSession(session, changes = {}, templates = []) {
    const merged = { ...session, ...changes };
    if (session.isProjected || typeof session.id !== 'number') {
      const created = await request('/schedule/sessions', {
        method: 'POST',
        fallbackError: 'Failed to save session',
        body: {
          template_id: merged.templateId ?? null,
          date: merged.dateKey || toDateKey(merged.start),
          start_time: clockToString(merged.start),
          end_time: clockToString(merged.end),
          trainer_name: merged.trainer || null,
          status: toBackendStatus(merged.status === 'not-recorded' || merged.status === 'scheduled' ? 'upcoming' : merged.status),
          checklist_data: { items: merged.checklist || [] }
        }
      });
      return mapSessionToFrontend(created, templates);
    }

    const payload = {};
    if (changes.checklist) payload.checklist_data = { items: changes.checklist };
    if (changes.status) payload.status = toBackendStatus(changes.status);
    if (changes.trainer) payload.trainer_name = changes.trainer;
    const updated = await request(`/schedule/sessions/${session.id}`, {
      method: 'PATCH',
      body: payload,
      fallbackError: 'Failed to update session'
    });
    return mapSessionToFrontend(updated, templates);
  },

  // Enrollments API
  async getEnrollments() {
    return request('/enrollments/', { fallbackError: 'Failed to load enrollments' });
  },

  async enrollMemberInClass(memberId, templateId) {
    return request('/enrollments/', {
      method: 'POST',
      body: { member_id: memberId, template_id: templateId },
      fallbackError: 'Failed to enroll member in class'
    });
  },

  async removeEnrollment(enrollmentId) {
    await request(`/enrollments/${enrollmentId}`, { method: 'DELETE', fallbackError: 'Failed to remove class enrollment' });
    return true;
  },

  // Plans API
  async getPlans(params = {}) {
    return request('/plans/', { query: params, fallbackError: 'Failed to load plans' });
  },

  async createPlan(planData) {
    return request('/plans/', { method: 'POST', body: planData, fallbackError: 'Failed to create plan' });
  },

  async getPlan(planId) {
    return request(`/plans/${planId}`, { fallbackError: 'Failed to load plan' });
  },

  async updatePlan(planId, planData) {
    return request(`/plans/${planId}`, { method: 'PATCH', body: planData, fallbackError: 'Failed to update plan' });
  },

  async deletePlan(planId) {
    await request(`/plans/${planId}`, { method: 'DELETE', fallbackError: 'Failed to delete plan' });
    return true;
  },

  async loadOfficialPackages() {
    return request('/plans/sync-official', { method: 'POST', fallbackError: 'Failed to load the official packages' })
      .catch(explainOutdatedServer);
  },

  // Analytics API
  async getAnalyticsSummary() {
    return request('/analytics/summary', { fallbackError: 'Failed to load analytics' });
  },

  async getNotificationAnalytics() {
    return request('/analytics/notifications', { fallbackError: 'Failed to load notification analytics' });
  },

  async getReminderSettings() {
    return request('/notifications/reminder-settings', { fallbackError: 'Failed to load reminder settings' });
  },

  /** Send today's due expiry reminders now (also runs automatically every morning). */
  async sendDueReminders() {
    return request('/tasks/daily-reminders', { method: 'POST', fallbackError: 'Failed to send reminders' })
      .catch(explainOutdatedServer);
  },

  async sendTestEmail(to) {
    return request('/notifications/test-email', { method: 'POST', body: { to }, fallbackError: 'Test email failed' })
      .catch(explainOutdatedServer);
  },

  async getNotificationJobs() {
    return request('/notifications/jobs', { fallbackError: 'Failed to load notification jobs' });
  },

  async triggerMembershipExpiryReminders() {
    return request('/tasks/membership-expiry-reminders', { method: 'POST', fallbackError: 'Failed to trigger expiry reminders' });
  },

  async triggerProcessNotificationJobs() {
    return request('/tasks/process-notification-jobs', { method: 'POST', fallbackError: 'Failed to trigger processing notification jobs' });
  },

  async triggerSeedDemoData() {
    return request('/tasks/seed-demo-data', { method: 'POST', fallbackError: 'Failed to seed demo data' });
  }
};

// Re-exported for components that format class times.
export { parseTimeRange };
