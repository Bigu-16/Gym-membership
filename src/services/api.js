export const API_BASE_URL = localStorage.getItem('gym_api_base_url') || import.meta.env.VITE_API_URL || 'https://gym-membership-f3ua.onrender.com/api/v1';

// Helpers to get/set tokens
const getAuthHeaders = () => {
  const token = localStorage.getItem('gym_api_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Day name conversion helpers
const SHORT_TO_FULL_DAYS = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday'
};

const FULL_TO_SHORT_DAYS = {
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
  'Friday': 'Fri',
  'Saturday': 'Sat',
  'Sunday': 'Sun'
};

const mapDaysToBackend = (daysStr) => {
  if (!daysStr) return [];
  return daysStr.split(',')
    .map(d => d.trim())
    .map(d => SHORT_TO_FULL_DAYS[d] || d);
};

const mapDaysToFrontend = (daysList) => {
  if (!daysList || !Array.isArray(daysList)) return '';
  return daysList.map(d => FULL_TO_SHORT_DAYS[d] || d).join(', ');
};

// Map member to frontend schema
const mapMemberToFrontend = (m) => ({
  id: m.id,
  name: m.name,
  phone: m.phone,
  parentPhone: m.parent_phone,
  gender: m.gender ? m.gender.charAt(0).toUpperCase() + m.gender.slice(1) : 'Male',
  medicalIssues: m.medical_issues || '',
  planId: m.plan_id,
  plan: m.plan_name || (m.plan_id === 4 ? 'Family Group' : m.plan_id === 3 ? 'Elite Performance' : m.plan_id === 2 ? 'Wellness Pro' : 'Starter Access'),
  expiryDate: m.expiry_date ? new Date(m.expiry_date).toISOString() : null,
  isFrozen: m.is_frozen,
  image: m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random&color=fff`,
  messagingOptIn: m.messaging_opt_in
});

// Map member to backend schema
const mapMemberToBackend = (m) => {
  let expiryDate = null;
  if (m.expiryDate) {
    if (m.expiryDate instanceof Date) {
      expiryDate = m.expiryDate.toISOString().split('T')[0];
    } else if (typeof m.expiryDate === 'string') {
      expiryDate = m.expiryDate.split('T')[0];
    }
  }
  return {
    name: m.name,
    phone: m.phone,
    parent_phone: m.parentPhone || null,
    gender: m.gender ? m.gender.toLowerCase() : null,
    medical_issues: m.medicalIssues || null,
    plan_id: m.planId || 3, // Default to Elite Performance
    expiry_date: expiryDate,
    messaging_opt_in: m.messagingOptIn !== undefined ? m.messagingOptIn : true,
    is_frozen: m.isFrozen || false
  };
};

// Map session to frontend schema
const mapSessionToFrontend = (s, templates = []) => {
  const template = Array.isArray(templates) ? templates.find(t => t.id === s.template_id) : null;
  const title = template ? (template.className || template.title || 'Group Class') : 'Personal Training';
  const timeStr = (template && template.time) || '10:00 AM - 11:30 AM';
  
  let startTimeStr;
  let endTimeStr;
  
  if (timeStr.includes(' - ')) {
    const parts = timeStr.split(' - ');
    startTimeStr = parts[0];
    endTimeStr = parts[1];
  } else {
    startTimeStr = timeStr;
    const [sh, sm] = timeStr.split(':').map(Number);
    const eh = sh + 1;
    const em = sm + 30;
    endTimeStr = `${String(eh).padStart(2, '0')}:${String(em % 60).padStart(2, '0')}`;
  }
  
  const parseTime = (tStr) => {
    let hours, minutes;
    if (tStr.includes(' ')) {
      const [timePart, ampm] = tStr.split(' ');
      const [h, m] = timePart.split(':').map(Number);
      hours = h;
      minutes = m;
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    } else {
      const [h, m] = tStr.split(':').map(Number);
      hours = h;
      minutes = m;
    }
    return { hours, minutes };
  };

  const startObj = parseTime(startTimeStr);
  const endObj = parseTime(endTimeStr);

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const startDate = parseLocalDate(s.date);
  startDate.setHours(startObj.hours, startObj.minutes, 0, 0);

  const endDate = parseLocalDate(s.date);
  endDate.setHours(endObj.hours, endObj.minutes, 0, 0);

  const checklist = s.checklist_data?.items || [];

  return {
    id: s.id,
    title: title,
    trainer: s.trainer_name,
    location: title.toLowerCase().includes('yoga') ? 'Zen Garden' : 'Studio B - Group Floor',
    start: startDate,
    end: endDate,
    status: s.status === 'in_progress' ? 'in-progress' : s.status,
    type: template?.type || 'personal',
    checklist: checklist,
    templateId: s.template_id
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
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    localStorage.setItem('gym_api_token', data.access_token);
    return data.access_token;
  },

  logout() {
    localStorage.removeItem('gym_api_token');
  },

  async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Unauthenticated');
    return response.json();
  },

  // Members API
  async getMembers(params = {}) {
    const url = new URL(`${API_BASE_URL}/members/`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load members');
    const data = await response.json();
    return data.map(mapMemberToFrontend);
  },

  async getMember(memberId) {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load member details');
    const data = await response.json();
    return mapMemberToFrontend(data);
  },

  async getFamilies(parentPhone = null) {
    const url = new URL(`${API_BASE_URL}/members/families`);
    if (parentPhone) {
      url.searchParams.append('parent_phone', parentPhone);
    }
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load families');
    const data = await response.json();
    return data.map(f => {
      const trainees = f.members.map(mapMemberToFrontend);
      const firstName = trainees.length > 0 ? trainees[0].name.split(' ')[0] : 'Family';
      const isFrozen = trainees.some(t => t.isFrozen);
      const expiryDate = trainees.length > 0 ? trainees[0].expiryDate : null;
      return {
        isGroup: true,
        id: f.parent_phone,
        parentName: f.parent_phone,
        parentPhone: f.parent_phone,
        trainees: trainees,
        name: `${firstName}'s Family`,
        plan: `Family Group (${trainees.length} Kids)`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=random&color=fff`,
        expiryDate: expiryDate,
        isFrozen: isFrozen
      };
    });
  },

  async enrollMembers(membersList) {
    // If it's a family (multiple members with parent phone), use create_family
    const isFamily = membersList.length > 1 && membersList[0].parentPhone;
    
    if (isFamily) {
      const payload = {
        members: membersList.map(mapMemberToBackend)
      };
      const response = await fetch(`${API_BASE_URL}/members/families`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Family registration failed');
      }
      const data = await response.json();
      return data.map(mapMemberToFrontend);
    } else {
      // Register single member
      const payload = mapMemberToBackend(membersList[0]);
      const response = await fetch(`${API_BASE_URL}/members/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Member registration failed');
      }
      const data = await response.json();
      return [mapMemberToFrontend(data)];
    }
  },

  async updateMember(memberId, memberData) {
    const payload = mapMemberToBackend(memberData);
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update member');
    const data = await response.json();
    return mapMemberToFrontend(data);
  },

  async freezeMember(memberId, isFrozen) {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}/freeze`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_frozen: isFrozen }),
    });
    if (!response.ok) throw new Error('Failed to update freeze status');
    const data = await response.json();
    return mapMemberToFrontend(data);
  },

  async freezeFamily(parentPhone, isFrozen) {
    const response = await fetch(`${API_BASE_URL}/members/families/${encodeURIComponent(parentPhone)}/freeze`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_frozen: isFrozen }),
    });
    if (!response.ok) throw new Error('Failed to update family freeze status');
    const data = await response.json();
    return data.map(mapMemberToFrontend);
  },

  async deleteMember(memberId) {
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete member');
    return true;
  },


  // Dashboard API
  async getActiveCheckIns() {
    const response = await fetch(`${API_BASE_URL}/dashboard/active-members`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load active check-ins');
    return response.json();
  },

  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load dashboard stats');
    return response.json();
  },

  async getRecentActivities(limit = 10) {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-activities?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load recent activities');
    return response.json();
  },

  async checkInMember(memberId) {
    const response = await fetch(`${API_BASE_URL}/check-ins/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ member_id: memberId }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Check-in failed');
    }
    return response.json();
  },

  async checkOutMember(memberId) {
    // 1. Get all check-ins to find the active one for this member
    const responseList = await fetch(`${API_BASE_URL}/check-ins/`, {
      headers: getAuthHeaders(),
    });
    if (!responseList.ok) throw new Error('Checkout failed');
    const checkIns = await responseList.json();
    const active = checkIns.find(c => c.member_id === memberId && !c.check_out_time);
    
    if (!active) {
      throw new Error('Member is not checked in');
    }

    // 2. Perform PATCH checkout
    const responseOut = await fetch(`${API_BASE_URL}/check-ins/${active.id}/check-out`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    if (!responseOut.ok) throw new Error('Checkout failed');
    return responseOut.json();
  },

  // Schedule templates API
  async getTemplates() {
    const response = await fetch(`${API_BASE_URL}/schedule/templates`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load schedule templates');
    const data = await response.json();
    return data.map(t => ({
      id: t.id,
      className: t.title,
      days: mapDaysToFrontend(t.days),
      time: t.time,
      capacity: t.capacity,
      enrolled: 0 // Will compute dynamically
    }));
  },

  async createTemplate(templateData) {
    const payload = {
      title: templateData.className,
      type: 'group', // Default to group
      days: mapDaysToBackend(templateData.days),
      time: templateData.time,
      capacity: Number(templateData.capacity),
    };
    const response = await fetch(`${API_BASE_URL}/schedule/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create class template');
    const t = await response.json();
    return {
      id: t.id,
      className: t.title,
      days: mapDaysToFrontend(t.days),
      time: t.time,
      capacity: t.capacity,
      enrolled: 0
    };
  },

  // Sessions API
  async getSessions(templates) {
    const response = await fetch(`${API_BASE_URL}/schedule/sessions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load sessions');
    const data = await response.json();
    return data.map(s => mapSessionToFrontend(s, templates));
  },

  async createSession(sessionData) {
    const payload = {
      template_id: sessionData.templateId || null,
      date: new Date(sessionData.start).toISOString().split('T')[0],
      trainer_name: sessionData.trainer || 'Assigned Coach',
      status: sessionData.status === 'in-progress' ? 'in_progress' : sessionData.status,
      checklist_data: { items: sessionData.checklist || [] }
    };
    const response = await fetch(`${API_BASE_URL}/schedule/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  },

  async updateSession(sessionId, updates) {
    const payload = {};
    if (updates.status) {
      payload.status = updates.status === 'in-progress' ? 'in_progress' : updates.status;
    }
    if (updates.checklist) {
      payload.checklist_data = { items: updates.checklist };
    }

    const response = await fetch(`${API_BASE_URL}/schedule/sessions/${sessionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update session');
    return response.json();
  },

  async updateSessionStatus(sessionId, status) {
    const response = await fetch(`${API_BASE_URL}/schedule/sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status: status === 'in-progress' ? 'in_progress' : status
      }),
    });
    if (!response.ok) throw new Error('Failed to update session status');
    return response.json();
  },

  // Enrollments API
  async getEnrollments() {
    const response = await fetch(`${API_BASE_URL}/enrollments/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to load enrollments');
    return response.json();
  },

  async enrollMemberInClass(memberId, templateId) {
    const response = await fetch(`${API_BASE_URL}/enrollments/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        member_id: memberId,
        template_id: templateId
      }),
    });
    if (!response.ok) throw new Error('Failed to enroll member in class');
    return response.json();
  }
};
