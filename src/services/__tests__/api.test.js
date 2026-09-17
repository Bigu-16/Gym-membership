import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService, API_BASE_URL, mapSessionToFrontend } from '../api';

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Auth API', () => {
    it('login sets auth token in localStorage on success', async () => {
      const mockTokenResponse = { access_token: 'test-token-123' };
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const token = await apiService.login('admin@example.com', 'password123');

      expect(token).toBe('test-token-123');
      expect(localStorage.getItem('gym_api_token')).toBe('test-token-123');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('login throws error on failure', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      await expect(apiService.login('wrong@example.com', 'wrong'))
        .rejects.toThrow('Invalid credentials');
      expect(localStorage.getItem('gym_api_token')).toBeNull();
    });

    it('logout removes token from localStorage', () => {
      localStorage.setItem('gym_api_token', 'active-token');
      apiService.logout();
      expect(localStorage.getItem('gym_api_token')).toBeNull();
    });

    it('getMe requests authenticated user profile', async () => {
      localStorage.setItem('gym_api_token', 'me-token');
      const mockProfile = { id: 1, email: 'me@example.com', full_name: 'Me' };
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      });

      const profile = await apiService.getMe();
      expect(profile).toEqual(mockProfile);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/me`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer me-token',
          }),
        })
      );
    });
  });

  describe('Members API', () => {
    const backendMember = {
      id: 10,
      name: 'John Doe',
      phone: '+1234567890',
      parent_phone: null,
      gender: 'male',
      medical_issues: 'Asthma',
      plan_id: 3,
      plan_name: 'Elite Performance',
      expiry_date: '2026-12-31',
      is_frozen: false,
      image: null,
      messaging_opt_in: true
    };

    it('getMembers fetches members list and maps fields correctly', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [backendMember],
      });

      const members = await apiService.getMembers();
      expect(members).toHaveLength(1);
      
      const mapped = members[0];
      expect(mapped.id).toBe(10);
      expect(mapped.name).toBe('John Doe');
      expect(mapped.gender).toBe('Male'); // mapped from 'male'
      expect(mapped.plan).toBe('Elite Performance');
      expect(mapped.expiryDate).toBe(new Date('2026-12-31').toISOString());
      expect(mapped.isFrozen).toBe(false);
      expect(mapped.image).toContain('ui-avatars.com');
    });

    it('getMember fetches specific member details', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => backendMember,
      });

      const member = await apiService.getMember(10);
      expect(member.name).toBe('John Doe');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/members/10`,
        expect.any(Object)
      );
    });

    it('getFamilies fetches group/family structures', async () => {
      const mockFamily = {
        parent_phone: '+987654321',
        members: [
          {
            id: 20,
            name: 'Jane Smith',
            phone: '+9876543210',
            parent_phone: '+987654321',
            gender: 'female',
            plan_id: 4,
            plan_name: 'Family Group',
            expiry_date: '2026-08-30',
            is_frozen: true
          }
        ]
      };

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockFamily],
      });

      const families = await apiService.getFamilies('+987654321');
      expect(families).toHaveLength(1);
      expect(families[0].isGroup).toBe(true);
      expect(families[0].name).toBe("Jane's Family");
      expect(families[0].trainees).toHaveLength(1);
      expect(families[0].isFrozen).toBe(true);
    });

    it('enrollMembers posts single member registration payload', async () => {
      const singleMemberInput = [{
        name: 'Alice',
        phone: '111222',
        gender: 'Female',
        medicalIssues: 'None',
        planId: 2,
        expiryDate: '2026-05-15T00:00:00.000Z',
        messagingOptIn: false
      }];

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 11,
          name: 'Alice',
          phone: '111222',
          gender: 'female',
          plan_id: 2,
          expiry_date: '2026-05-15',
          is_frozen: false
        }),
      });

      const result = await apiService.enrollMembers(singleMemberInput);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/members/`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Alice',
            phone: '111222',
            age: 25,
            parent_phone: null,
            gender: 'female',
            medical_issues: 'None',
            plan_id: 2,
            expiry_date: '2026-05-15',
            messaging_opt_in: false,
            is_frozen: false
          })
        })
      );
    });

    it('enrollMembers posts family group registration payload when multiple members exist', async () => {
      const familyInput = [
        { name: 'Kid 1', phone: '123', parentPhone: '999', planId: 4, age: 10 },
        { name: 'Kid 2', phone: '456', parentPhone: '999', planId: 4, age: 12 }
      ];

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 30, name: 'Kid 1', phone: '123', parent_phone: '999', plan_id: 4, age: 10 },
          { id: 31, name: 'Kid 2', phone: '456', parent_phone: '999', plan_id: 4, age: 12 }
        ],
      });

      const result = await apiService.enrollMembers(familyInput);
      expect(result).toHaveLength(2);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/members/families`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            parent: {
              name: 'Parent Contact',
              phone: '999'
            },
            members: [
              { name: 'Kid 1', phone: '123', age: 10, parent_phone: '999', gender: null, medical_issues: null, plan_id: 4, expiry_date: null, messaging_opt_in: true, is_frozen: false },
              { name: 'Kid 2', phone: '456', age: 12, parent_phone: '999', gender: null, medical_issues: null, plan_id: 4, expiry_date: null, messaging_opt_in: true, is_frozen: false }
            ]
          })
        })
      );
    });
  });

  describe('Check-Ins API', () => {
    it('checkInMember posts member id', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 5, member_id: 10, check_in_time: '2026-07-16T12:00:00Z' }),
      });

      const checkin = await apiService.checkInMember(10);
      expect(checkin.member_id).toBe(10);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/check-ins/`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ member_id: 10 })
        })
      );
    });

    it('checkOutMember retrieves active check-ins and calls checkout PATCH', async () => {
      // 1. mock check-ins list fetch
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 2, member_id: 10, check_out_time: '2026-07-16T10:00:00Z' },
          { id: 3, member_id: 10, check_out_time: null } // active one
        ]
      });

      // 2. mock checkout PATCH response
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 3, member_id: 10, check_out_time: '2026-07-16T12:30:00Z' })
      });

      const checkout = await apiService.checkOutMember(10);
      expect(checkout.id).toBe(3);
      expect(globalThis.fetch).toHaveBeenNthCalledWith(1, `${API_BASE_URL}/check-ins/`, expect.any(Object));
      expect(globalThis.fetch).toHaveBeenNthCalledWith(2, `${API_BASE_URL}/check-ins/3/check-out`, expect.objectContaining({
        method: 'PATCH'
      }));
    });
  });

  describe('Schedule and Sessions API', () => {
    it('getTemplates formats day names from database string array to UI string', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, title: 'Yoga Flow', days: ['Monday', 'Wednesday'], time: '09:00 AM', capacity: 15 }
        ],
      });

      const templates = await apiService.getTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].days).toBe('Mon, Wed');
      expect(templates[0].className).toBe('Yoga Flow');
    });

    it('createTemplate maps frontend values to backend schema', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 5,
          title: 'Spinning',
          days: ['Tuesday', 'Thursday'],
          time: '06:00 PM',
          capacity: 20
        })
      });

      const result = await apiService.createTemplate({
        className: 'Spinning',
        days: 'Tue, Thu',
        time: '06:00 PM',
        capacity: '20'
      });

      expect(result.className).toBe('Spinning');
      expect(result.days).toBe('Tue, Thu');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/schedule/templates`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: 'Spinning',
            type: 'group',
            days: ['Tuesday', 'Thursday'],
            time: '06:00 PM',
            capacity: 20
          })
        })
      );
    });

    it('updateTemplate sends PATCH with updated fields', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 5,
          title: 'Advanced Spinning',
          days: ['Tuesday', 'Thursday'],
          time: '07:00 PM',
          capacity: 25
        })
      });

      const result = await apiService.updateTemplate(5, {
        className: 'Advanced Spinning',
        time: '07:00 PM',
        capacity: 25
      });

      expect(result.className).toBe('Advanced Spinning');
      expect(result.time).toBe('07:00 PM');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/schedule/templates/5`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            title: 'Advanced Spinning',
            time: '07:00 PM',
            capacity: 25
          })
        })
      );
    });

    it('deleteTemplate sends DELETE request', async () => {
      globalThis.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await apiService.deleteTemplate(5);
      expect(result).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/schedule/templates/5`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('updateSession persists checklist and status to backend PATCH', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12,
          checklist_data: { items: [{ id: 1, text: 'Warm up', checked: true }] },
          status: 'in_progress'
        })
      });

      const checklist = [{ id: 1, text: 'Warm up', checked: true }];
      await apiService.updateSession(12, { checklist, status: 'in-progress' });

      expect(localStorage.getItem('gym_session_checklist_12')).toBe(JSON.stringify(checklist));
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/schedule/sessions/12`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            checklist_data: { items: checklist },
            status: 'in_progress'
          })
        })
      );
    });

    it('mapSessionToFrontend normalizes checklist items ensuring each has unique id and boolean checked', () => {
      const rawSession = {
        id: 15,
        template_id: null,
        trainer_name: 'Coach Marcus',
        date: '2026-09-17',
        status: 'in_progress',
        checklist_data: {
          items: [
            { text: 'Warm up', checked: true },
            { text: 'Cardio', checked: false },
            { text: 'Stretching', checked: false }
          ]
        }
      };

      const mapped = mapSessionToFrontend(rawSession, []);
      expect(mapped.checklist).toHaveLength(3);
      expect(mapped.checklist[0]).toEqual({ id: 1, text: 'Warm up', checked: true });
      expect(mapped.checklist[1]).toEqual({ id: 2, text: 'Cardio', checked: false });
      expect(mapped.checklist[2]).toEqual({ id: 3, text: 'Stretching', checked: false });
    });
  });

  describe('Plans API', () => {
    const mockPlan = {
      id: 1,
      name: 'Elite Performance',
      program: 'General',
      duration_label: 'One Month',
      duration_months: 1,
      classes_per_week: 3,
      price: '149.00',
      currency: 'AED',
      included_items: ['Unlimited Gym', 'Sauna Access'],
      description: 'Full access plan',
      duration_days: 30,
      sort_order: 1,
      is_active: true,
      created_at: '2026-07-20T11:00:00.000Z',
      updated_at: '2026-07-20T11:00:00.000Z'
    };

    it('getPlans fetches plans list with query parameters', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPlan],
      });

      const plans = await apiService.getPlans({ program: 'General', is_active: true });
      expect(plans).toHaveLength(1);
      expect(plans[0]).toEqual(mockPlan);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/plans/?program=General&is_active=true`,
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' })
        })
      );
    });

    it('createPlan posts new plan payload', async () => {
      const planPayload = {
        name: 'Starter Access',
        program: 'General',
        duration_label: 'One Month',
        duration_months: 1,
        classes_per_week: 1,
        price: 49,
        currency: 'AED',
        included_items: ['Gym Access'],
        description: 'Basic plan',
        duration_days: 30,
        sort_order: 0,
        is_active: true
      };

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...planPayload, price: '49.00', id: 2 }),
      });

      const result = await apiService.createPlan(planPayload);
      expect(result.id).toBe(2);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/plans/`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(planPayload)
        })
      );
    });

    it('getPlan fetches a single plan by ID', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlan,
      });

      const plan = await apiService.getPlan(1);
      expect(plan).toEqual(mockPlan);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/plans/1`,
        expect.anything()
      );
    });

    it('updatePlan sends PUT request with updated plan data', async () => {
      const updateData = { name: 'Elite Performance Pro', price: 179 };
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockPlan, ...updateData, price: '179.00' }),
      });

      const updated = await apiService.updatePlan(1, updateData);
      expect(updated.name).toBe('Elite Performance Pro');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/plans/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      );
    });

    it('deletePlan sends DELETE request', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const res = await apiService.deletePlan(1);
      expect(res).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/plans/1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws custom error on request failure', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Plan not found' }),
      });

      await expect(apiService.getPlan(999)).rejects.toThrow('Plan not found');
    });
  });

  describe('Notifications & Tasks API', () => {
    it('getNotificationJobs fetches jobs successfully', async () => {
      const mockJobs = [
        {
          id: 1,
          member_id: 10,
          notification_type: 'welcome',
          status: 'pending',
          scheduled_for: '2026-08-05T15:28:49.980Z',
          processed_at: null,
          payload: { name: 'John Doe' },
          provider: 'internal',
          error_message: null
        }
      ];
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJobs,
      });

      const result = await apiService.getNotificationJobs();
      expect(result).toEqual(mockJobs);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/notifications/jobs`,
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    it('triggerMembershipExpiryReminders triggers task successfully', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: 'task-123', status: 'queued' }),
      });

      const result = await apiService.triggerMembershipExpiryReminders();
      expect(result).toEqual({ task_id: 'task-123', status: 'queued' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tasks/membership-expiry-reminders`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('triggerProcessNotificationJobs triggers task successfully', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task_id: 'task-456', status: 'queued' }),
      });

      const result = await apiService.triggerProcessNotificationJobs();
      expect(result).toEqual({ task_id: 'task-456', status: 'queued' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tasks/process-notification-jobs`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('triggerSeedDemoData triggers task successfully', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'seeded' }),
      });

      const result = await apiService.triggerSeedDemoData();
      expect(result).toEqual({ status: 'seeded' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tasks/seed-demo-data`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
