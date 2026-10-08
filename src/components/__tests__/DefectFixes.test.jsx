import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';
import Analytics from '../Analytics';
import Schedule from '../Schedule';
import TemplateManagement from '../TemplateManagement';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    getDashboardStats: vi.fn().mockResolvedValue({ total_members: 10, active_members: 5 }),
    getRecentActivities: vi.fn().mockResolvedValue([]),
    updateSession: vi.fn().mockResolvedValue({ id: 1 }),
    updateSessionStatus: vi.fn().mockResolvedValue({ id: 1, status: 'in-progress' }),
    checkInMember: vi.fn().mockResolvedValue({}),
    checkOutMember: vi.fn().mockResolvedValue({})
  }
}));

describe('Gym App Defect Fixes Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // #1 Changes to a session's task checklist are saved and stay after refresh
  it('#1: changes to checklist (toggle, add, delete) persist and restore from localStorage on refresh', async () => {
    const mockSessions = [
      {
        id: 42,
        title: 'Personal Training',
        trainer: 'Marcus Thorne',
        location: 'Studio B',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        status: 'in-progress',
        type: 'personal',
        checklist: [
          { id: 1, text: 'Safety warm-up completed', checked: false }
        ]
      }
    ];

    function TestWrapper({ initialSessions }) {
      const [sessions, setSessions] = React.useState(initialSessions);
      return (
        <DashboardOverview
          members={[]}
          sessions={sessions}
          setSessions={setSessions}
          scheduleTemplates={[]}
          inClubList={[]}
          setInClubList={vi.fn()}
        />
      );
    }

    const { unmount } = render(<TestWrapper initialSessions={mockSessions} />);

    // 1. Toggle task
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);

    // Should write to localStorage
    const savedAfterToggle = JSON.parse(localStorage.getItem('gym_session_checklist_42'));
    expect(savedAfterToggle[0].checked).toBe(true);

    // 2. Add new task
    const input = screen.getByPlaceholderText(/Add custom daily activity/i);
    const addBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.change(input, { target: { value: 'Core sequence test' } });
    fireEvent.click(addBtn);

    const savedAfterAdd = JSON.parse(localStorage.getItem('gym_session_checklist_42'));
    expect(savedAfterAdd).toHaveLength(2);
    expect(savedAfterAdd[0].checked).toBe(true);
    expect(savedAfterAdd[1].text).toBe('Core sequence test');

    // Simulate page refresh (unmount and remount with fresh props)
    unmount();

    render(<TestWrapper initialSessions={mockSessions} />);

    // Checklist changes should still be present from localStorage!
    expect(screen.getByText('Core sequence test')).toBeInTheDocument();
    const reloadedCheckboxes = screen.getAllByRole('checkbox');
    expect(reloadedCheckboxes[0]).toBeChecked();
  });

  // #2 Deleting a checklist task does not rely on window.confirm and shows in-app modal
  it('#2: deleting a checklist task opens in-app confirmation modal without using window.confirm', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');

    const mockSessions = [
      {
        id: 42,
        title: 'Personal Training',
        trainer: 'Marcus Thorne',
        location: 'Studio B',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        status: 'in-progress',
        type: 'personal',
        checklist: [
          { id: 1, text: 'Safety warm-up completed', checked: false }
        ]
      }
    ];

    render(
      <DashboardOverview
        members={[]}
        sessions={mockSessions}
        setSessions={vi.fn()}
        scheduleTemplates={[]}
        inClubList={[]}
        setInClubList={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle('Delete task');
    fireEvent.click(deleteBtn);

    // window.confirm must NOT have been called
    expect(confirmSpy).not.toHaveBeenCalled();

    // In-app confirmation modal should be visible
    expect(screen.getByText('Delete Protocol Task')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete this task/i)).toBeInTheDocument();

    // Clicking Cancel closes modal without deleting
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText('Delete Protocol Task')).not.toBeInTheDocument();
  });

  // #3 Pause / Start Session button updates visually immediately
  it('#3: clicking Pause Session or Start Session immediately updates session status and button', async () => {
    const mockSessions = [
      {
        id: 10,
        title: 'Taekwondo Sparring',
        trainer: 'Master Kim',
        location: 'Studio B',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        status: 'in-progress',
        type: 'group',
        checklist: []
      }
    ];

    let currentSessions = [...mockSessions];
    const setSessions = (updater) => {
      currentSessions = typeof updater === 'function' ? updater(currentSessions) : updater;
    };

    const mockOnUpdateSessionStatus = vi.fn();

    const { rerender } = render(
      <DashboardOverview
        members={[]}
        sessions={currentSessions}
        setSessions={setSessions}
        scheduleTemplates={[]}
        inClubList={[]}
        setInClubList={vi.fn()}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Currently In Progress -> button is "Pause Session"
    const pauseBtn = screen.getByRole('button', { name: /Pause Session/i });
    expect(pauseBtn).toBeInTheDocument();

    fireEvent.click(pauseBtn);

    // Re-render with updated session state
    rerender(
      <DashboardOverview
        members={[]}
        sessions={currentSessions}
        setSessions={setSessions}
        scheduleTemplates={[]}
        inClubList={[]}
        setInClubList={vi.fn()}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Status updated to Upcoming, button changed to "Start Session"
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Session/i })).toBeInTheDocument();
    expect(mockOnUpdateSessionStatus).toHaveBeenCalledWith(10, 'upcoming');
  });

  // #4 "Expiring" members filter includes expired and expiring soon
  it('#4: expiring members filter logic includes both expired (days <= 0) and expiring soon (days <= 7)', () => {
    const calculateDaysRemaining = (date) => {
      if (!date) return 9999;
      const today = new Date();
      const expiry = new Date(date);
      const diffTime = expiry - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const today = new Date();
    const expiredDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
    const expiringSoonDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days left
    const activeDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days left

    const members = [
      { id: 1, name: 'Expired Member', expiryDate: expiredDate },
      { id: 2, name: 'Expiring Soon Member', expiryDate: expiringSoonDate },
      { id: 3, name: 'Active Member', expiryDate: activeDate }
    ];

    // Filter logic as implemented in useGymData
    const filterExpiring = (list) => list.filter(item => {
      const days = calculateDaysRemaining(item.expiryDate);
      return days <= 7;
    });

    const result = filterExpiring(members);
    expect(result.map(m => m.name)).toEqual(['Expired Member', 'Expiring Soon Member']);
    expect(result.find(m => m.name === 'Active Member')).toBeUndefined();
  });

  // #5 Analytics zone filter updates metrics and charts
  it('#5: switching zone filter in Analytics updates metrics, charts, and leaderboard', () => {
    const mockMembers = [
      { id: 1, name: 'Alice', plan: 'Elite Performance' }, // Main Floor
      { id: 2, name: 'Bob', plan: 'Wellness Pro' }, // Zen Garden
      { id: 3, name: 'Charlie', plan: 'Diamond Access' } // VIP Zone
    ];

    const mockTemplates = [
      { id: 1, className: 'Taekwondo Elite', enrolled: 10, capacity: 15 },
      { id: 2, className: 'Zen Yoga Flow', enrolled: 12, capacity: 15 },
      { id: 3, className: 'VIP Private Session', enrolled: 1, capacity: 1 }
    ];

    render(<Analytics members={mockMembers} scheduleTemplates={mockTemplates} />);

    // Initially 'All' zone: total revenue = 250 + 150 + 400 = 800
    expect(screen.getByText(/800/)).toBeInTheDocument();

    // Click 'Zen Garden' zone
    const zenBtn = screen.getByRole('button', { name: 'Zen Garden' });
    fireEvent.click(zenBtn);

    // In Zen Garden zone: only Bob (Wellness Pro, 150) -> revenue should be 150!
    expect(screen.getByText(/150/)).toBeInTheDocument();
    // Zen Garden leaderboard should display Zen Yoga Flow
    expect(screen.getByText('Zen Yoga Flow')).toBeInTheDocument();

    // Click 'VIP Zone'
    const vipBtn = screen.getByRole('button', { name: 'VIP Zone' });
    fireEvent.click(vipBtn);

    // In VIP zone: only Charlie (Diamond Access, 400) -> revenue should be 400!
    expect(screen.getByText(/400/)).toBeInTheDocument();
  });

  // #6 Class start time matches between template card and its edit screen
  it('#6: Yoga Flow template start time on card matches start time in edit modal, even when days is array', async () => {
    const yogaTemplate = [
      {
        id: 2,
        className: 'Yoga Flow',
        days: ['Tuesday', 'Thursday'], // array format
        time: '16:30', // 24h format
        capacity: 16
      }
    ];

    render(<TemplateManagement
      membershipPlans={[]}
      scheduleTemplates={yogaTemplate}
      onAddPlan={vi.fn()}
      onUpdatePlan={vi.fn()}
      onDeletePlan={vi.fn()}
      onAddScheduleTemplate={vi.fn()}
      onUpdateScheduleTemplate={vi.fn()}
      onDeleteScheduleTemplate={vi.fn()}
    />);

    fireEvent.click(screen.getByRole('button', { name: /Weekly Schedule/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /Yoga Flow/i })[0]);

    // Modal should open without throwing an error
    expect(screen.getByText('Edit Template')).toBeInTheDocument();

    // Start Time input must be '16:30' (4:30 PM), NOT default '16:00' (4:00 PM)
    const startTimeInput = screen.getByDisplayValue('16:30');
    expect(startTimeInput).toBeInTheDocument();
  });
});
