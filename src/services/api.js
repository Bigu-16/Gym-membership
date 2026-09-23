export const API_BASE_URL = localStorage.getItem('gym_api_base_url') || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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

// Parent info client-side cache helpers
export const PARENT_NAMES_KEY = 'gym_parent_info_cache';

export const getStoredParentMap = () => {
  try {
    return JSON.parse(localStorage.getItem(PARENT_NAMES_KEY) || '{}');
  } catch {
    return {};
  }
};

export const setStoredParentInfo = (parentPhone, parentName, memberPhone = null, parentEmail = null) => {
  if (!parentPhone && !memberPhone) return;
  try {
    const current = getStoredParentMap();
    const info = {
      name: parentName || undefined,
      email: parentEmail || undefined,
      phone: parentPhone || undefined
    };
    if (parentPhone) {
      current[parentPhone] = { ...(current[parentPhone] || {}), ...info };
    }
    if (memberPhone) {
      current[memberPhone] = { ...(current[memberPhone] || {}), ...info };
    }
    localStorage.setItem(PARENT_NAMES_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Failed to cache parent info', e);
  }
};

export const getStoredParentName = (parentPhone, memberPhone = null) => {
  const current = getStoredParentMap();
  if (parentPhone && current[parentPhone]?.name) return current[parentPhone].name;
  if (memberPhone && current[memberPhone]?.name) return current[memberPhone].name;
  return null;
};

// Map member to frontend schema
export const mapMemberToFrontend = (m) => {
  const parentPhone = m.parent_phone || m.parentPhone || null;
  const parentName = m.parent_name || m.parentName || getStoredParentName(parentPhone, m.phone) || null;
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    parentPhone: parentPhone,
    parentName: parentName,
    gender: m.gender ? m.gender.charAt(0).toUpperCase() + m.gender.slice(1) : 'Male',
    medicalIssues: m.medical_issues || m.medicalIssues || '',
    planId: m.plan_id || m.planId,
    plan: m.plan_name || m.plan || (m.plan_id === 4 ? 'Family Group' : m.plan_id === 3 ? 'Elite Performance' : m.plan_id === 2 ? 'Wellness Pro' : 'Starter Access'),
    expiryDate: m.expiry_date ? new Date(m.expiry_date).toISOString() : (m.expiryDate || null),
    isFrozen: m.is_frozen !== undefined ? m.is_frozen : (m.isFrozen || false),
    image: m.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random&color=fff`,
    messagingOptIn: m.messaging_opt_in !== undefined ? m.messaging_opt_in : (m.messagingOptIn !== undefined ? m.messagingOptIn : true)
  };
};

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
    age: m.age ? parseInt(m.age, 10) : 25,
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
export const mapSessionToFrontend = (s, templates = []) => {
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

  let checklist = Array.isArray(s.checklist_data) ? s.checklist_data : (s.checklist_data?.items || []);
  try {
    const localSaved = localStorage.getItem(`gym_session_checklist_${s.id}`);
    if (localSaved) {
      checklist = JSON.parse(localSaved);
    }
  } catch (e) {
    console.error('Error reading local checklist state:', e);
  }

  // Ensure every checklist item has a stable, unique id and valid checked boolean
  checklist = checklist.map((item, idx) => ({
    id: item.id !== undefined && item.id !== null ? item.id : (idx + 1),
    text: item.text || '',
    checked: Boolean(item.checked)
  }));

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
      const pPhone = f.parent?.phone || f.parent_phone || null;
      const pName = f.parent?.name || f.parent_name || (pPhone ? getStoredParentName(pPhone) : null) || 'Parent Contact';
      const pEmail = f.parent?.email || f.parent_email || null;

      if (pPhone && pName && pName !== 'Parent Contact') {
        setStoredParentInfo(pPhone, pName, null, pEmail);
      }

      const trainees = (f.members || []).map(m => {
        if (m.phone && pName && pName !== 'Parent Contact') {
          setStoredParentInfo(pPhone, pName, m.phone, pEmail);
        }
        return mapMemberToFrontend({
          ...m,
          parent_phone: pPhone,
          parent_name: pName !== 'Parent Contact' ? pName : (m.parent_name || null)
        });
      });

      const firstName = trainees.length > 0 ? trainees[0].name.split(' ')[0] : (pName !== 'Parent Contact' ? pName.split(' ')[0] : 'Family');
      const displayName = (f.parent?.name || f.parent_name)
        ? `${(f.parent?.name || f.parent_name).split(' ')[0]}'s Family`
        : `${firstName}'s Family`;
      const isFrozen = trainees.some(t => t.isFrozen);
      const expiryDate = trainees.length > 0 ? trainees[0].expiryDate : null;

      return {
        isGroup: true,
        id: pPhone || f.id,
        parentName: pName,
        parentPhone: pPhone,
        parentEmail: pEmail,
        trainees: trainees,
        name: displayName,
        plan: `Family Group (${trainees.length} Kids)`,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent((f.parent?.name || f.parent_name) ? (f.parent?.name || f.parent_name) : firstName)}&background=random&color=fff`,
        expiryDate: expiryDate,
        isFrozen: isFrozen
      };
    });
  },

  async enrollMembers(membersList) {
    if (!membersList || membersList.length === 0) return [];

    const primary = membersList[0];
    const parentPhone = primary.parentPhone || null;
    const parentName = primary.parentName || null;
    const parentEmail = primary.parentEmail || null;

    if (parentPhone && parentName) {
      setStoredParentInfo(parentPhone, parentName, primary.phone, parentEmail);
      membersList.forEach(m => {
        if (m.phone) {
          setStoredParentInfo(parentPhone, parentName, m.phone, parentEmail);
        }
      });
    }

    const isFamily = Boolean(parentPhone);
    
    if (isFamily) {
      const payload = {
        parent: {
          name: parentName || 'Parent Contact',
          phone: parentPhone,
          email: parentEmail || undefined,
        },
        members: membersList.map(m => ({
          ...mapMemberToBackend(m),
          age: m.age ? Math.min(18, Math.max(4, parseInt(m.age, 10))) : 10
        }))
      };

      try {
        let response = await fetch(`${API_BASE_URL}/members/families`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        // Retry once on transient 5xx server errors (common with Render database cold starts)
        if (response.status >= 500) {
          await new Promise(r => setTimeout(r, 1000));
          response = await fetch(`${API_BASE_URL}/members/families`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });
        }

        if (response.ok) {
          const data = await response.json();
          const pName = data.parent?.name || parentName;
          const pPhone = data.parent?.phone || parentPhone;
          const list = data.members || (Array.isArray(data) ? data : [data]);
          return list.map(m => mapMemberToFrontend({
            ...m,
            parent_name: pName,
            parent_phone: pPhone
          }));
        }

        const err = await response.json().catch(() => ({}));
        if (response.status !== 409) {
          throw new Error(err.detail || 'Family registration failed');
        }
      } catch (err) {
        if (!err.message?.includes('already in use') && !err.message?.includes('Family registration failed')) {
          throw err;
        }
      }

      // Fallback: register members individually if family already existed
      const enrolledMembers = [];
      for (const m of membersList) {
        const payload = mapMemberToBackend(m);
        const res = await fetch(`${API_BASE_URL}/members/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Member registration failed');
        }
        const data = await res.json();
        enrolledMembers.push(mapMemberToFrontend({
          ...data,
          parent_name: parentName,
          parent_phone: parentPhone
        }));
      }
      return enrolledMembers;
    } else {
      // Register single member without parent
      const payload = mapMemberToBackend(membersList[0]);
      const response = await fetch(`${API_BASE_URL}/members/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Member registration failed');
      }
      const data = await response.json();
      return [mapMemberToFrontend(data)];
    }
  },

  async updateMember(memberId, memberData) {
    if (memberData.parentPhone && memberData.parentName) {
      setStoredParentInfo(memberData.parentPhone, memberData.parentName, memberData.phone);
    }
    const payload = mapMemberToBackend(memberData);
    const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update member');
    const data = await response.json();
    return mapMemberToFrontend({
      ...data,
      parent_name: memberData.parentName || undefined,
      parent_phone: memberData.parentPhone || undefined
    });
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

  async updateTemplate(templateId, templateData) {
    const payload = {};
    if (templateData.className !== undefined) payload.title = templateData.className;
    if (templateData.days !== undefined) payload.days = mapDaysToBackend(templateData.days);
    if (templateData.time !== undefined) payload.time = templateData.time;
    if (templateData.capacity !== undefined) payload.capacity = Number(templateData.capacity);

    const response = await fetch(`${API_BASE_URL}/schedule/templates/${templateId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update class template');
    const t = await response.json();
    return {
      id: t.id,
      className: t.title,
      days: mapDaysToFrontend(t.days),
      time: t.time,
      capacity: t.capacity,
      enrolled: templateData.enrolled || 0
    };
  },

  async deleteTemplate(templateId) {
    const response = await fetch(`${API_BASE_URL}/schedule/templates/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete class template');
    return true;
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
    if (updates.checklist) {
      try {
        localStorage.setItem(`gym_session_checklist_${sessionId}`, JSON.stringify(updates.checklist));
      } catch (e) {
        console.error('Error writing local checklist state:', e);
      }
    }

    // If it's a virtual/projected template placeholder (e.g. 'template-3-2026-09-21'),
    // it does not exist in the database yet. Ticking a checklist item should NOT send
    // a POST request (which creates a new session in the DB) nor an invalid string PATCH (which triggers 422).
    // We persist the checklist in localStorage and return the updated state.
    if (typeof sessionId === 'string' && sessionId.startsWith('template-')) {
      return {
        id: sessionId,
        checklist_data: { items: updates.checklist || [] },
        ...updates
      };
    }

    const payload = {};
    if (updates.checklist) {
      payload.checklist_data = { items: updates.checklist };
    }
    if (updates.status) {
      payload.status = updates.status === 'in-progress' ? 'in_progress' : updates.status;
    }
    if (updates.trainer) {
      payload.trainer_name = updates.trainer;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/schedule/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend update failed, using local/fallback status:', e);
    }

    if (updates.status) {
      return this.updateSessionStatus(sessionId, updates.status);
    }

    return {
      id: sessionId,
      checklist_data: { items: updates.checklist || [] }
    };
  },

  async updateSessionStatus(sessionId, status) {
    // When explicitly starting a virtual template session, materialize it into the DB
    if (typeof sessionId === 'string' && sessionId.startsWith('template-')) {
      const parts = sessionId.split('-');
      const tempId = parseInt(parts[1], 10);
      const dateStr = parts.length >= 5 
        ? `${parts[2]}-${parts[3]}-${parts[4]}` 
        : new Date().toISOString().split('T')[0];

      try {
        const created = await this.createSession({
          templateId: isNaN(tempId) ? null : tempId,
          start: dateStr,
          trainer: 'Assigned Coach',
          status: status === 'in-progress' ? 'in_progress' : status,
          checklist: []
        });
        return created;
      } catch (e) {
        console.warn('Could not materialize session on status change, falling back:', e);
        return { id: sessionId, status };
      }
    }

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
  },

  // Plans API
  async getPlans(params = {}) {
    const url = new URL(`${API_BASE_URL}/plans/`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    const response = await fetch(url.toString(), {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to load plans');
    }
    return response.json();
  },

  async createPlan(planData) {
    const response = await fetch(`${API_BASE_URL}/plans/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to create plan');
    }
    return response.json();
  },

  async getPlan(planId) {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to load plan');
    }
    return response.json();
  },

  async updatePlan(planId, planData) {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to update plan');
    }
    return response.json();
  },

  async deletePlan(planId) {
    const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to delete plan');
    }
    return true;
  },

  async getNotificationJobs() {
    const response = await fetch(`${API_BASE_URL}/notifications/jobs`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to load notification jobs');
    }
    return response.json();
  },

  async triggerMembershipExpiryReminders() {
    const response = await fetch(`${API_BASE_URL}/tasks/membership-expiry-reminders`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to trigger expiry reminders');
    }
    return response.json();
  },

  async triggerProcessNotificationJobs() {
    const response = await fetch(`${API_BASE_URL}/tasks/process-notification-jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to trigger processing notification jobs');
    }
    return response.json();
  },

  async triggerSeedDemoData() {
    const response = await fetch(`${API_BASE_URL}/tasks/seed-demo-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to seed demo data');
    }
    return response.json();
  }
};
