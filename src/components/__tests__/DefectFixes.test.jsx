import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateManagement from '../TemplateManagement';
import { daysUntil, membershipStatus, needsRenewalAttention, EXPIRING_SOON_DAYS } from '../../utils/membership';

describe('Gym App Defect Fixes Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // #4 "Expiring" members filter includes expired and expiring soon
  it('#4: expiring members filter logic includes both expired (days <= 0) and expiring soon (days <= 7)', () => {
    const today = new Date();
    const offset = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const members = [
      { id: 1, name: 'Expired Member', expiryDate: offset(-5) },
      { id: 2, name: 'Expiring Soon Member', expiryDate: offset(3) },
      { id: 3, name: 'Active Member', expiryDate: offset(60) },
      { id: 4, name: 'No Expiry Member', expiryDate: null }
    ];

    // Same rule useGymData applies for the "Expiring" filter.
    const result = members.filter((m) => needsRenewalAttention(m, today));
    expect(result.map((m) => m.name)).toEqual(['Expired Member', 'Expiring Soon Member']);
    expect(membershipStatus(members[0], today)).toBe('expired');
    expect(membershipStatus(members[1], today)).toBe('expiring');
    expect(daysUntil(members[1].expiryDate, today)).toBeLessThanOrEqual(EXPIRING_SOON_DAYS);
  });

  // #6 Class start time matches between template card and its edit screen
  it('#6: Class template start time on card matches start time in edit modal, even when days is array', async () => {
    const yogaTemplate = [
      {
        id: 2,
        className: 'Little Kids Karate',
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

    fireEvent.click(screen.getAllByRole('button', { name: /Little Kids Karate/i })[0]);

    // Modal should open without throwing an error
    expect(screen.getByText('Edit Template')).toBeInTheDocument();

    // Start Time input must be '16:30' (4:30 PM), NOT default '16:00' (4:00 PM)
    const startTimeInput = screen.getByDisplayValue('16:30');
    expect(startTimeInput).toBeInTheDocument();
  });
});
