import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar Component', () => {
  const mockOnTabChange = vi.fn();

  it('renders all menu items in desktop and mobile layouts', () => {
    render(<Sidebar activeTab="members" onTabChange={mockOnTabChange} />);
    
    // We should see "Overview", "Members", "Schedule", "Analytics", "Enrollment" in both desktop aside and mobile menu.
    // Screen should find duplicates because there are two lists rendered (desktop <aside> and mobile <div>).
    const overviewBtns = screen.getAllByRole('button', { name: /Overview/i });
    expect(overviewBtns.length).toBeGreaterThanOrEqual(2);

    const membersBtns = screen.getAllByRole('button', { name: /Members/i });
    expect(membersBtns.length).toBeGreaterThanOrEqual(2);

    const scheduleBtns = screen.getAllByRole('button', { name: /Schedule/i });
    expect(scheduleBtns.length).toBeGreaterThanOrEqual(2);

    const analyticsBtns = screen.getAllByRole('button', { name: /Analytics/i });
    expect(analyticsBtns.length).toBeGreaterThanOrEqual(2);

    const enrollmentBtns = screen.getAllByRole('button', { name: /Enrollment/i });
    expect(enrollmentBtns.length).toBeGreaterThanOrEqual(2);

    const notificationsBtns = screen.getAllByRole('button', { name: /Notifications/i });
    expect(notificationsBtns.length).toBeGreaterThanOrEqual(2);

    // The timetable is edited inside Schedule, so it has no separate menu item.
    expect(screen.queryByRole('button', { name: /Timetable|Templates/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Packages/i }).length).toBeGreaterThanOrEqual(2);

    // No invented "shift" — without a timetable there are simply no classes today.
    expect(screen.queryByText(/Morning Session/i)).not.toBeInTheDocument();
    expect(screen.getByText(/No classes today/i)).toBeInTheDocument();
  });

  it('calls onTabChange when desktop sidebar items are clicked', () => {
    render(<Sidebar activeTab="dashboard" onTabChange={mockOnTabChange} />);

    // Get all buttons for "Schedule" and click the first one (desktop aside button)
    const scheduleBtn = screen.getAllByRole('button', { name: /Schedule/i })[0];
    fireEvent.click(scheduleBtn);

    expect(mockOnTabChange).toHaveBeenCalledWith('schedule');
  });

  it('calls onTabChange when mobile layout tabs are clicked', () => {
    render(<Sidebar activeTab="dashboard" onTabChange={mockOnTabChange} />);

    // Click the second button for "Analytics" (mobile floating bar button)
    const analyticsBtn = screen.getAllByRole('button', { name: /Analytics/i })[1];
    fireEvent.click(analyticsBtn);

    expect(mockOnTabChange).toHaveBeenCalledWith('analytics');
  });

  it('applies correct active styling classes to active tab', () => {
    render(<Sidebar activeTab="schedule" onTabChange={mockOnTabChange} />);
    
    // Desktop: Schedule button should have active background class
    const desktopScheduleBtn = screen.getAllByRole('button', { name: /Schedule/i })[0];
    expect(desktopScheduleBtn).toHaveClass('bg-[var(--text-primary)]');
    
    // Desktop: Dashboard button (inactive) should not have the active background class
    const desktopDashboardBtn = screen.getAllByRole('button', { name: /Overview/i })[0];
    expect(desktopDashboardBtn).not.toHaveClass('bg-[var(--text-primary)]');
  });
});

describe('Sidebar today panel', () => {
  it("summarises today's real class hours from the timetable", () => {
    const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    const templates = [
      { id: 1, className: 'Kids Taekwondo', days: today, time: '16:00 - 17:00' },
      { id: 2, className: 'Adult Karate', days: today, time: '20:00 - 21:00' }
    ];
    render(<Sidebar activeTab="dashboard" onTabChange={vi.fn()} scheduleTemplates={templates} />);
    expect(screen.getByText('2 classes · 4:00 PM – 9:00 PM')).toBeInTheDocument();
  });
});
