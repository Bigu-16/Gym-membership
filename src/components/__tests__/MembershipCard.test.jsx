import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MembershipCard from '../MembershipCard';
import MemberGrid from '../MemberGrid';
import { formatDate } from '../../utils/membership';
import { toDateKey } from '../../utils/classSessions';

const daysFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};

const activeMember = {
  id: 1,
  name: 'Alice Cooper',
  plan: 'Elite Performance',
  expiryDate: daysFromToday(15),
  image: 'https://avatar.com/alice',
  isFrozen: false,
  isGroup: false
};

const renderRow = (member, onManage = vi.fn()) => {
  render(<ul><MembershipCard member={member} onManage={onManage} /></ul>);
  return onManage;
};

describe('MembershipCard (members list row)', () => {
  it('shows name, package, active status and expiry date', () => {
    renderRow(activeMember);
    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    expect(screen.getByText('Elite Performance')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(formatDate(activeMember.expiryDate))).toBeInTheDocument();
  });

  it('shows "Expiring in N days" inside the reminder window', () => {
    renderRow({ ...activeMember, expiryDate: daysFromToday(3) });
    expect(screen.getByText('Expiring in 3 days')).toBeInTheDocument();
  });

  it('calls onManage from the Manage button and from the row', () => {
    const onManage = renderRow(activeMember);
    fireEvent.click(screen.getByRole('button', { name: 'Manage Alice Cooper' }));
    expect(onManage).toHaveBeenCalledTimes(1);
    expect(onManage).toHaveBeenCalledWith(activeMember);

    fireEvent.click(screen.getByText('Alice Cooper'));
    expect(onManage).toHaveBeenCalledTimes(2);
  });

  it('shows frozen status with the paused days', () => {
    renderRow({ ...activeMember, isFrozen: true, frozenSince: null, freezeUntil: null });
    expect(screen.getByText('Frozen')).toBeInTheDocument();
    expect(screen.getByText(/days? paused until unfrozen/)).toBeInTheDocument();
    expect(screen.queryByTestId('membership-progress')).not.toBeInTheDocument();
  });

  it('shows expired status when the expiry date is in the past', () => {
    renderRow({ ...activeMember, expiryDate: daysFromToday(-5) });
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('shows a family with its trainee count and names', () => {
    renderRow({
      id: 'family-group',
      name: "Jack's Family",
      plan: 'Family Group (2 Kids)',
      expiryDate: daysFromToday(15),
      image: '',
      isFrozen: false,
      isGroup: true,
      trainees: [{ id: 2, name: 'Kid 1' }, { id: 3, name: 'Kid 2' }]
    });
    expect(screen.getByText("Jack's Family")).toBeInTheDocument();
    expect(screen.getByText('Family · 2 trainees: Kid 1, Kid 2')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('sizes the progress bar from the package duration, not a fixed 30 days', () => {
    const expiryDate = daysFromToday(45);
    const { rerender } = render(
      <ul><MembershipCard member={{ ...activeMember, expiryDate, planDetails: { id: 3, duration_months: 3 } }} onManage={vi.fn()} /></ul>
    );
    expect(screen.getByTestId('membership-progress')).toHaveStyle({ width: '50%' });
    rerender(<ul><MembershipCard member={{ ...activeMember, expiryDate, planDetails: { id: 5, duration_months: 12 } }} onManage={vi.fn()} /></ul>);
    expect(screen.getByTestId('membership-progress')).toHaveStyle({ width: '13%' });
  });

  it('shows "No expiry set" when there is no expiry date', () => {
    renderRow({ ...activeMember, expiryDate: null });
    expect(screen.getByText('No expiry set')).toBeInTheDocument();
  });
});

describe('MemberGrid', () => {
  it('renders one row per member in a single list', () => {
    render(<MemberGrid members={[activeMember, { ...activeMember, id: 2, name: 'Bob Dylan' }]} onManage={vi.fn()} />);
    expect(screen.getByRole('list', { name: 'Members' }).children).toHaveLength(2);
  });

  it('shows an empty state when there are no members', () => {
    render(<MemberGrid members={[]} onManage={vi.fn()} />);
    expect(screen.getByText('No members match this view.')).toBeInTheDocument();
  });
});
