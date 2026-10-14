import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EnrollmentForm from '../EnrollmentForm';
import * as scheduleConfig from '../../config/scheduleConfig';

const PROGRAMS = ['Taekwondo', 'Karate', 'Kickboxing', 'Kung Fu', 'Fitness'];
const PERKS = { Taekwondo: ['Free uniform'], Karate: ['Free uniform'], Kickboxing: ['Free gloves'] };

// The 25 official packages, as the backend returns them.
const officialPlans = PROGRAMS.flatMap((program, p) => [
  { label: '1 month', months: 1, perWeek: 2, price: '300.00', items: [] },
  { label: '1 month', months: 1, perWeek: 3, price: '350.00', items: [] },
  { label: '3 months', months: 3, perWeek: 3, price: '900.00', items: PERKS[program] || [] },
  { label: '6 months', months: 6, perWeek: null, price: program === 'Fitness' ? '1450.00' : '1400.00', items: [] },
  { label: '1 year', months: 12, perWeek: null, price: '2550.00', items: [] }
].map((row, i) => ({
  id: p * 5 + i + 1,
  name: `${program} ${row.label}`,
  program,
  duration_label: row.label,
  duration_months: row.months,
  duration_days: null,
  classes_per_week: row.perWeek,
  price: row.price,
  currency: 'AED',
  included_items: row.items,
  description: '',
  is_active: true,
  sort_order: p * 5 + i
})));

describe('enrollment packages come from the backend', () => {
  it('no longer ships hardcoded package templates', () => {
    expect(scheduleConfig.PACKAGE_TEMPLATES).toBeUndefined();
    expect(scheduleConfig.ACTIVITIES).toBeUndefined();
    scheduleConfig.GROUP_SCHEDULE_SLOTS.forEach((slot) => expect(slot.enrolled).toBeUndefined());
  });

  it('renders every active backend package as a selectable card', () => {
    render(<EnrollmentForm onEnroll={vi.fn()} scheduleTemplates={[]} membershipPlans={officialPlans} />);

    expect(screen.getByRole('heading', { name: 'Package Templates' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(25);
    expect(screen.getByRole('button', { name: 'Select Taekwondo, 1 month, 2 classes per week, 300 AED' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select Fitness, 6 months, unlimited classes, 1450 AED' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select Kung Fu, 1 year, unlimited classes, 2550 AED' })).toBeInTheDocument();
  });

  it('hides inactive packages', () => {
    const plans = officialPlans.map((plan) => (plan.program === 'Kung Fu' ? { ...plan, is_active: false } : plan));
    render(<EnrollmentForm onEnroll={vi.fn()} scheduleTemplates={[]} membershipPlans={plans} />);
    expect(screen.getAllByRole('button', { name: /^Select / })).toHaveLength(20);
    expect(screen.queryByRole('button', { name: /^Select Kung Fu/ })).not.toBeInTheDocument();
  });

  it('uses the selected package price and shows its free items', () => {
    render(<EnrollmentForm onEnroll={vi.fn()} scheduleTemplates={[]} membershipPlans={officialPlans} />);
    fireEvent.click(screen.getByRole('button', { name: 'Select Kickboxing, 3 months, 3 classes per week, 900 AED' }));
    expect(screen.getByLabelText('Amount paid for trainee 1')).toHaveValue(900);
    expect(screen.getAllByText(/Free gloves/).length).toBeGreaterThan(0);
  });

  it('offers to load the official packages when none exist instead of using hardcoded ones', async () => {
    const onLoadOfficialPackages = vi.fn().mockResolvedValue({ created: 25 });
    render(<EnrollmentForm onEnroll={vi.fn()} scheduleTemplates={[]} membershipPlans={[]} onLoadOfficialPackages={onLoadOfficialPackages} />);

    expect(screen.getByText('No packages are set up yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Select / })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load official packages' }));
    expect(onLoadOfficialPackages).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: 'Load official packages' })).toBeEnabled();
  });

  it('will not submit a group enrollment without a package', async () => {
    const onEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={onEnroll} scheduleTemplates={[]} membershipPlans={officialPlans} />);
    fireEvent.change(screen.getByLabelText('Parent/guardian full name'), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText('Parent/guardian mobile'), { target: { value: '+971501234567' } });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Leo Smith' } });
    fireEvent.change(screen.getByLabelText('Age'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirm Enrollment/i }));
    expect(await screen.findByText('Leo Smith: choose a package.')).toBeInTheDocument();
    expect(onEnroll).not.toHaveBeenCalled();
  });
});
