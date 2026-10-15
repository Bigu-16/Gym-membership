import { describe, it, expect, beforeEach } from 'vitest';
import { apiService, mapMemberToBackend, mapMemberToFrontend, mapSessionToFrontend } from '../api';

const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (body, status) => ({ ok: false, status, json: async () => body });
const lastCall = () => {
  const [url, init] = fetch.mock.calls.at(-1);
  return { url: String(url), method: init?.method || 'GET', body: init?.body ? JSON.parse(init.body) : undefined, headers: init?.headers };
};

describe('apiService', () => {
  beforeEach(() => {
    fetch.mockReset();
    sessionStorage.setItem('gym_api_token', 'token-123');
  });

  describe('auth', () => {
    it('stores the token on login and reports readable errors', async () => {
      fetch.mockResolvedValueOnce(ok({ access_token: 'abc' }));
      await apiService.login('admin@example.com', 'pw');
      expect(sessionStorage.setItem).toHaveBeenCalledWith('gym_api_token', 'abc');

      fetch.mockResolvedValueOnce(fail({ detail: 'Invalid email or password' }, 401));
      await expect(apiService.login('x@y.z', 'bad')).rejects.toThrow('Invalid email or password');
    });

    it('sends the bearer token and surfaces 401 as Unauthenticated', async () => {
      fetch.mockResolvedValueOnce(fail({ detail: 'expired' }, 401));
      await expect(apiService.getMe()).rejects.toThrow('Unauthenticated');
      expect(lastCall().headers.Authorization).toBe('Bearer token-123');
    });

    it('turns validation errors into a readable message', async () => {
      fetch.mockResolvedValueOnce(fail({ detail: [{ loc: ['body', 'members', 0, 'age'], msg: 'Input should be greater than or equal to 2' }] }, 422));
      await expect(apiService.getPlans()).rejects.toThrow('members › 0 › age: Input should be greater than or equal to 2');
    });
  });

  describe('members', () => {
    it('maps backend members including age, IDs and family', () => {
      const member = mapMemberToFrontend({
        id: 1, name: 'Lina Example', phone: null, whatsapp_number: null, emirates_id: '784-2023-1234567-1',
        parent_phone: '+971501110001', family_id: 4, gender: 'female', age: 3, plan_id: 7,
        expiry_date: '2026-11-14', is_frozen: false, messaging_opt_in: true
      });
      expect(member).toMatchObject({ age: 3, emiratesId: '784-2023-1234567-1', familyId: 4, gender: 'Female', expiryDate: '2026-11-14', planId: 7 });
      expect(member.plan).toBeNull(); // resolved from the real package list, never a hardcoded name
    });

    it('only sends the fields that are present, so edits never reset age or plan', () => {
      expect(mapMemberToBackend({ name: 'Layla Haddad', medicalIssues: 'Asthma' })).toEqual({ name: 'Layla Haddad', medical_issues: 'Asthma' });
      expect(mapMemberToBackend({ age: '3', expiryDate: new Date(2026, 10, 14) })).toEqual({ age: 3, expiry_date: '2026-11-14' });
    });

    it('registers children under their parent without inventing phone numbers', async () => {
      fetch.mockResolvedValueOnce(ok({
        id: 4,
        parent: { name: 'Sara', phone: '+971501110001' },
        members: [{ id: 1, name: 'Lina', age: 3, phone: null }, { id: 2, name: 'Zaid', age: 8, phone: null }]
      }, 201));

      const created = await apiService.enrollMembers(
        [
          { name: 'Lina', age: 3, gender: 'Female', planId: 7, payment: { amount: 350, method: 'cash' } },
          { name: 'Zaid', age: 8, gender: 'Male', planId: 9 }
        ],
        { name: 'Sara', phone: '+971501110001' }
      );

      const { url, method, body } = lastCall();
      expect(url).toContain('/members/families');
      expect(method).toBe('POST');
      expect(body.parent).toEqual({ name: 'Sara', phone: '+971501110001' });
      expect(body.members[0]).toEqual({ name: 'Lina', age: 3, gender: 'female', plan_id: 7, payment: { amount: 350, method: 'cash', currency: 'AED' } });
      expect(body.members[1]).not.toHaveProperty('phone');
      expect(created.map((m) => m.parentName)).toEqual(['Sara', 'Sara']);
    });

    it('registers adults individually with their own phone', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 9, name: 'Omar Siddiqui', phone: '+971504440004', age: 29 }, 201));
      await apiService.enrollMembers([{ name: 'Omar Siddiqui', phone: '+971504440004', age: 29, planId: 3 }]);
      const { url, body } = lastCall();
      expect(url).toMatch(/\/members\/$/);
      expect(body).toEqual({ name: 'Omar Siddiqui', phone: '+971504440004', age: 29, plan_id: 3 });
    });

    it('renews through the renew endpoint with plan and payment', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 9, name: 'Omar', age: 29, expiry_date: '2027-01-14' }));
      await apiService.renewMember(9, { planId: 3, startFrom: 'expiry', payment: { amount: '900', method: 'card' } });
      expect(lastCall()).toMatchObject({
        method: 'POST',
        body: { plan_id: 3, start_from: 'expiry', payment: { amount: 900, method: 'card', currency: 'AED' } }
      });
      expect(lastCall().url).toContain('/members/9/renew');
    });

    it('freezes a family by id and reads the group response', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 4, parent: { name: 'Sara' }, members: [{ id: 1, name: 'Lina', age: 3, is_frozen: true }] }));
      const members = await apiService.freezeFamily('4', true);
      expect(lastCall().url).toContain('/members/families/4/freeze');
      expect(members[0]).toMatchObject({ isFrozen: true, parentName: 'Sara' });
    });
  });

  describe('check-ins', () => {
    it('checks out using only the open visit', async () => {
      fetch.mockResolvedValueOnce(ok([{ id: 55, member_id: 3, check_out_time: null }]));
      fetch.mockResolvedValueOnce(ok({ id: 55 }));
      await apiService.checkOutMember(3);
      expect(String(fetch.mock.calls[0][0])).toContain('member_id=3');
      expect(String(fetch.mock.calls[0][0])).toContain('open_only=true');
      expect(lastCall()).toMatchObject({ method: 'PATCH' });
      expect(lastCall().url).toContain('/check-ins/55/check-out');
    });

    it('can override a blocked check-in', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 1 }, 201));
      await apiService.checkInMember(3, { override: true });
      expect(lastCall().body).toEqual({ member_id: 3, override: true });
    });
  });

  describe('sessions', () => {
    const templates = [{ id: 1, className: 'Kids Taekwondo', time: '16:00 - 17:00', type: 'group', capacity: 15 }];

    it('maps sessions with their own clock time, else the class slot, as one-hour classes', () => {
      const fromTemplate = mapSessionToFrontend({ id: 1, template_id: 1, date: '2026-10-14', status: 'in_progress', trainer_name: 'Coach', checklist_data: { items: [{ text: 'a' }] } }, templates);
      expect(fromTemplate.start).toEqual(new Date(2026, 9, 14, 16, 0));
      expect(fromTemplate.end).toEqual(new Date(2026, 9, 14, 17, 0));
      expect(fromTemplate.status).toBe('in-progress');
      expect(fromTemplate.checklist).toEqual([{ id: 1, text: 'a', checked: false }]);

      const orphan = mapSessionToFrontend({ id: 2, template_id: null, date: '2026-10-14', start_time: '18:30', end_time: '19:30', status: 'upcoming', trainer_name: 'Coach', checklist_data: {} }, templates);
      expect(orphan.title).toBe('Class (removed from timetable)');
      expect(orphan.start).toEqual(new Date(2026, 9, 14, 18, 30));
    });

    it('records a timetable class by template and local date (backend reuses an existing one)', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 77, template_id: 1, date: '2026-10-14', start_time: '16:00', end_time: '17:00', status: 'in_progress', trainer_name: 'Coach Nasser', checklist_data: { items: [] } }, 201));
      const projected = {
        id: 'template-1-2026-10-14', templateId: 1, dateKey: '2026-10-14', isProjected: true,
        start: new Date(2026, 9, 14, 16), end: new Date(2026, 9, 14, 17), trainer: 'Coach Nasser', status: 'scheduled', checklist: []
      };
      const saved = await apiService.saveSession(projected, { status: 'in-progress' }, templates);

      expect(lastCall()).toMatchObject({
        method: 'POST',
        body: { template_id: 1, date: '2026-10-14', start_time: '16:00', end_time: '17:00', trainer_name: 'Coach Nasser', status: 'in_progress' }
      });
      expect(saved).toMatchObject({ id: 77, isProjected: false });
    });

    it('patches recorded sessions and never writes to browser storage', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 77, template_id: 1, date: '2026-10-14', status: 'completed', trainer_name: 'Coach', checklist_data: { items: [] } }));
      await apiService.saveSession({ id: 77, isProjected: false }, { status: 'completed', checklist: [] }, templates);
      expect(lastCall()).toMatchObject({ method: 'PATCH', body: { status: 'completed', checklist_data: { items: [] } } });
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('fails loudly instead of pretending a save worked', async () => {
      fetch.mockResolvedValueOnce(fail({ detail: 'Session not found' }, 404));
      await expect(apiService.saveSession({ id: 5, isProjected: false }, { status: 'completed' })).rejects.toThrow('Session not found');
    });
  });

  describe('timetable and packages', () => {
    it('maps templates including the coach', async () => {
      fetch.mockResolvedValueOnce(ok([{ id: 1, title: 'Kids Taekwondo', type: 'group', days: ['Monday', 'Wednesday'], time: '16:00 - 17:00', capacity: 15, trainer_name: 'Coach Nasser' }]));
      const [template] = await apiService.getTemplates();
      expect(template).toMatchObject({ className: 'Kids Taekwondo', days: 'Mon, Wed', trainer: 'Coach Nasser' });
    });

    it('creates templates with full day names', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 2, title: 'Kids Karate', type: 'group', days: ['Friday'], time: '17:00 - 18:00', capacity: 15 }, 201));
      await apiService.createTemplate({ className: 'Kids Karate', days: 'Fri', time: '17:00 - 18:00', capacity: 15, trainer: 'Coach Tasneem' });
      expect(lastCall().body).toEqual({ title: 'Kids Karate', type: 'group', days: ['Friday'], time: '17:00 - 18:00', capacity: 15, trainer_name: 'Coach Tasneem' });
    });

    it('loads the official timetable and packages from the backend catalog', async () => {
      fetch.mockResolvedValueOnce(ok({ created: 11, total: 11 }));
      await apiService.loadOfficialTimetable();
      expect(lastCall()).toMatchObject({ method: 'POST' });
      expect(lastCall().url).toContain('/schedule/templates/sync-official');

      fetch.mockResolvedValueOnce(ok({ created: 25, updated: 0, total: 25 }));
      await apiService.loadOfficialPackages();
      expect(lastCall().url).toContain('/plans/sync-official');
    });

    it('updates plans with PATCH', async () => {
      fetch.mockResolvedValueOnce(ok({ id: 3, price: '375.00' }));
      await apiService.updatePlan(3, { price: 375 });
      expect(lastCall()).toMatchObject({ method: 'PATCH', body: { price: 375 } });
    });
  });

  it('loads the analytics summary', async () => {
    fetch.mockResolvedValueOnce(ok({ totals: { total: 8 } }));
    await expect(apiService.getAnalyticsSummary()).resolves.toEqual({ totals: { total: 8 } });
    expect(lastCall().url).toContain('/analytics/summary');
  });
});
