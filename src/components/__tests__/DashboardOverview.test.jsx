import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    getDashboardStats: vi.fn(),
    getRecentActivities: vi.fn()
  }
}));

// Wednesday 14 Oct 2026, 15:00 local
const NOW = new Date(2026, 9, 14, 15, 0, 0);

const templates = [
  { id: 1, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '16:00 - 17:00', capacity: 15, enrolled: 1, trainer: 'Coach Nasser' },
  { id: 2, className: 'Kids Taekwondo', days: 'Mon, Wed', time: '17:00 - 18:00', capacity: 15, enrolled: 0 },
  { id: 3, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '20:00 - 21:00', capacity: 15, enrolled: 0 }
];

const members = [
  { id: 10, name: 'Rashid Al Ketbi', plan: 'Taekwondo One Month - 3 Classes', expiryDate: '2026-11-01', isFrozen: false, image: 'r.png', enrolledTemplateIds: [1] },
  { id: 11, name: 'Priya Nair', plan: 'Fitness One Month - 3 Classes', expiryDate: '2026-10-01', isFrozen: false, image: 'p.png', enrolledTemplateIds: [] }
];

const renderDashboard = (overrides = {}) => {
  const props = {
    members,
    sessions: [],
    scheduleTemplates: templates,
    inClubList: [],
    onTabChange: vi.fn(),
    saveSession: vi.fn().mockImplementation(async (session, changes) => ({ ...session, ...changes, id: 501, isProjected: false })),
    checkIn: vi.fn().mockResolvedValue({}),
    checkOut: vi.fn().mockResolvedValue({}),
    ...overrides
  };
  render(<DashboardOverview {...props} />);
  return props;
};

describe('DashboardOverview', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    apiService.getDashboardStats.mockResolvedValue({ total_members: 2, active_members: 0, today_sessions: 2, recent_activities: 3 });
    apiService.getRecentActivities.mockResolvedValue([
      { check_in_id: 1, member_id: 10, member_name: 'Rashid Al Ketbi', action: 'check_out', timestamp: '2026-10-13T14:00:00Z' }
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows today's real timetable classes with real numbers (no invented stats)", async () => {
    renderDashboard();

    await waitFor(() => expect(screen.getByText('3 check-ins today')).toBeInTheDocument());
    const classes = screen.getAllByRole('article');
    expect(classes).toHaveLength(2);
    expect(within(classes[0]).getByText('Kids Taekwondo')).toBeInTheDocument();
    expect(within(classes[0]).getByText(/Coach Nasser/)).toBeInTheDocument();
    expect(within(classes[0]).getByText('1/15 enrolled')).toBeInTheDocument();
    expect(screen.queryByText(/Adult Karate/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+8%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Capacity reached/i)).not.toBeInTheDocument();
  });

  it('starting a class saves that exact class slot and date', async () => {
    const props = renderDashboard();
    const [first] = screen.getAllByRole('article');

    fireEvent.click(within(first).getByRole('button', { name: 'Start class' }));

    await waitFor(() => expect(props.saveSession).toHaveBeenCalledTimes(1));
    const [session, changes] = props.saveSession.mock.calls[0];
    expect(session).toMatchObject({ templateId: 1, dateKey: '2026-10-14', isProjected: true });
    expect(changes).toEqual({ status: 'in-progress' });
  });

  it('checklist edits go to the backend, with an in-app confirmation before removing', async () => {
    const props = renderDashboard();
    const [first] = screen.getAllByRole('article');

    fireEvent.click(within(first).getByLabelText('Roll call & attendance'));
    await waitFor(() => expect(props.saveSession).toHaveBeenCalledTimes(1));
    expect(props.saveSession.mock.calls[0][1].checklist[0]).toMatchObject({ text: 'Roll call & attendance', checked: true });

    fireEvent.click(within(first).getByRole('button', { name: 'Remove Warm-up & stretching' }));
    expect(props.saveSession).toHaveBeenCalledTimes(1);
    fireEvent.click(within(first).getByRole('button', { name: 'Confirm removing Warm-up & stretching' }));
    await waitFor(() => expect(props.saveSession).toHaveBeenCalledTimes(2));
    expect(props.saveSession.mock.calls[1][1].checklist.map((i) => i.text)).not.toContain('Warm-up & stretching');
  });

  it("lists members enrolled in today's classes and checks them in", async () => {
    const props = renderDashboard();

    const desk = screen.getByRole('region', { name: 'Desk check-in' });
    expect(within(desk).getByText('Rashid Al Ketbi')).toBeInTheDocument();
    expect(within(desk).queryByText('Priya Nair')).not.toBeInTheDocument();

    fireEvent.click(within(desk).getByRole('button', { name: 'Check in' }));
    await waitFor(() => expect(props.checkIn).toHaveBeenCalledWith(10, undefined));
  });

  it('explains a blocked check-in and lets the desk override it', async () => {
    const checkIn = vi.fn()
      .mockRejectedValueOnce(new Error('Membership has expired'))
      .mockResolvedValueOnce({});
    renderDashboard({ checkIn });

    fireEvent.change(screen.getByLabelText('Search members to check in'), { target: { value: 'priya' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Membership has expired');
    fireEvent.click(within(alert).getByRole('button', { name: 'Let in anyway' }));
    await waitFor(() => expect(checkIn).toHaveBeenLastCalledWith(11, { override: true }));
  });

  it('check-out is always visible (works on touch screens)', async () => {
    const props = renderDashboard({ inClubList: [10] });

    fireEvent.click(screen.getByRole('button', { name: 'Check out' }));
    await waitFor(() => expect(props.checkOut).toHaveBeenCalledWith(10));
  });
});
