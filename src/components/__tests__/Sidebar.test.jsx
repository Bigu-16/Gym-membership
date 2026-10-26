import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Sidebar from '../Sidebar';

describe('Sidebar', () => {
  it('groups the menu into front-desk and manage sections', () => {
    render(<Sidebar activeTab="dashboard" onTabChange={vi.fn()} />);
    const [desktop] = screen.getAllByRole('navigation', { name: 'Main' });
    expect(within(desktop).getByText('Front desk')).toBeInTheDocument();
    expect(within(desktop).getByText('Manage')).toBeInTheDocument();
    for (const label of ['Overview', 'Members', 'New registration', 'Schedule', 'Packages', 'Messages', 'Analytics']) {
      expect(within(desktop).getByRole('button', { name: label })).toBeInTheDocument();
    }
    // No duplicated "today" panel; the Overview already shows today.
    expect(screen.queryByText(/classes ·/)).not.toBeInTheDocument();
  });

  it('shows the activity log to admins only', () => {
    const { rerender } = render(<Sidebar activeTab="dashboard" onTabChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Activity/ })).not.toBeInTheDocument();
    rerender(<Sidebar activeTab="dashboard" onTabChange={vi.fn()} isAdmin />);
    expect(screen.getAllByRole('button', { name: /Activity/ }).length).toBeGreaterThanOrEqual(1);
  });

  it('marks the current page and changes page on click (desktop and mobile)', () => {
    const onTabChange = vi.fn();
    render(<Sidebar activeTab="schedule" onTabChange={onTabChange} />);
    const scheduleButtons = screen.getAllByRole('button', { name: 'Schedule' });
    scheduleButtons.forEach((button) => expect(button).toHaveAttribute('aria-current', 'page'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Members' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(onTabChange).toHaveBeenNthCalledWith(1, 'members');
    expect(onTabChange).toHaveBeenNthCalledWith(2, 'enrollment');
  });
});
