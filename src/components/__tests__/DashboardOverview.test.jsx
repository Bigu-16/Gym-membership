import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardOverview from '../DashboardOverview';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => {
  return {
    apiService: {
      getDashboardStats: vi.fn(),
      getRecentActivities: vi.fn(),
      checkInMember: vi.fn(),
      checkOutMember: vi.fn(),
      updateSessionStatus: vi.fn(),
      updateSession: vi.fn(),
      createSession: vi.fn()
    }
  };
});

describe('DashboardOverview Component', () => {
  const mockOnTabChange = vi.fn();
  const mockOnUpdateSessionStatus = vi.fn();
  const mockSetSessions = vi.fn();
  const mockSetInClubList = vi.fn();

  const mockMembers = [
    { id: 1, name: 'Alice Cooper', plan: 'Elite Performance', isFrozen: false, image: '' },
    { id: 2, name: 'Bob Dylan', plan: 'Wellness Pro', isFrozen: false, image: '' }
  ];

  const mockSessions = [
    {
      id: 10,
      title: 'Zumba Fitness',
      trainer: 'Marcus Thorne',
      location: 'Studio B',
      start: new Date(),
      end: new Date(Date.now() + 3600000),
      status: 'upcoming',
      type: 'group',
      checklist: []
    }
  ];

  const mockStats = {
    total_members: 15,
    active_members: 3,
    weekly_growth: 8,
    today_sessions: 2
  };

  const mockActivities = [
    { member_name: 'Alice Cooper', action: 'check-in', timestamp: '2026-07-16T12:00:00Z' },
    { member_name: 'Bob Dylan', action: 'checkout', timestamp: '2026-07-16T11:00:00Z' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    apiService.getDashboardStats.mockResolvedValue(mockStats);
    apiService.getRecentActivities.mockResolvedValue(mockActivities);
  });

  it('fetches and displays performance stats and recent activities on mount', async () => {
    render(
      <DashboardOverview
        members={mockMembers}
        sessions={mockSessions}
        setSessions={mockSetSessions}
        scheduleTemplates={[]}
        onTabChange={mockOnTabChange}
        inClubList={[1]}
        setInClubList={mockSetInClubList}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    expect(apiService.getDashboardStats).toHaveBeenCalled();
    expect(apiService.getRecentActivities).toHaveBeenCalled();

    // Verify stats appear
    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument(); // total registered
      expect(screen.getAllByText('Alice Cooper').length).toBeGreaterThan(0);
      expect(screen.getByText('Checked in')).toBeInTheDocument();
      expect(screen.getByText('Checked out')).toBeInTheDocument();
    });
  });

  it('searches for members and checks them in', async () => {
    apiService.checkInMember.mockResolvedValue({ id: 99, member_id: 2 });
    
    render(
      <DashboardOverview
        members={mockMembers}
        sessions={mockSessions}
        setSessions={mockSetSessions}
        scheduleTemplates={[]}
        onTabChange={mockOnTabChange}
        inClubList={[1]} // Alice in club, Bob not
        setInClubList={mockSetInClubList}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search member name...');
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    // Roster dropdown lists matching name
    const dropdownResult = screen.getAllByText('Bob Dylan')[0];
    expect(dropdownResult).toBeInTheDocument();

    // Click check in
    const checkInBtn = screen.getByRole('button', { name: /Check In/i });
    fireEvent.click(checkInBtn);

    await waitFor(() => {
      expect(apiService.checkInMember).toHaveBeenCalledWith(2);
      expect(mockSetInClubList).toHaveBeenCalled();
    });
  });

  it('checks out a checked-in member', async () => {
    apiService.checkOutMember.mockResolvedValue({ id: 5 });

    render(
      <DashboardOverview
        members={mockMembers}
        sessions={mockSessions}
        setSessions={mockSetSessions}
        scheduleTemplates={[]}
        onTabChange={mockOnTabChange}
        inClubList={[1]} // Alice is in club
        setInClubList={mockSetInClubList}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    });

    // Find the checkout button
    const checkoutBtn = screen.getByRole('button', { name: 'Checkout' });
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(apiService.checkOutMember).toHaveBeenCalledWith(1);
      expect(mockSetInClubList).toHaveBeenCalled();
    });
  });

  it('toggles session status', async () => {
    render(
      <DashboardOverview
        members={mockMembers}
        sessions={mockSessions}
        setSessions={mockSetSessions}
        scheduleTemplates={[]}
        onTabChange={mockOnTabChange}
        inClubList={[]}
        setInClubList={mockSetInClubList}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Zumba Fitness')).toBeInTheDocument();
    });

    const startSessionBtn = screen.getByRole('button', { name: /Start Session/i });
    fireEvent.click(startSessionBtn);

    expect(mockOnUpdateSessionStatus).toHaveBeenCalledWith(10, 'in-progress');
  });

  it('filters session cards by categories', async () => {
    render(
      <DashboardOverview
        members={mockMembers}
        sessions={mockSessions}
        setSessions={mockSetSessions}
        scheduleTemplates={[]}
        onTabChange={mockOnTabChange}
        inClubList={[]}
        setInClubList={mockSetInClubList}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Zumba Fitness')).toBeInTheDocument();
    });

    // Check category pills exist
    expect(screen.getByRole('button', { name: 'Fitness' })).toBeInTheDocument();
  });
});
