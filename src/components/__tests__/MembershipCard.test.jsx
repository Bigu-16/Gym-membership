import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MembershipCard from '../MembershipCard';
import { toDateKey } from '../../utils/classSessions';

describe('MembershipCard Component', () => {
  const mockOnManage = vi.fn();
  
  // Set up a base active member
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15); // 15 days in the future
  
  const activeMember = {
    id: 1,
    name: 'Alice Cooper',
    plan: 'Elite Performance',
    expiryDate: toDateKey(futureDate),
    image: 'https://avatar.com/alice',
    isFrozen: false,
    isGroup: false
  };

  it('renders active membership details and status', () => {
    render(<MembershipCard member={activeMember} onManage={mockOnManage} />);
    
    expect(screen.getByText('Alice Cooper')).toBeInTheDocument();
    expect(screen.getByText('Elite Performance')).toBeInTheDocument();
    expect(screen.getByText(/15 Days Left/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Alice Cooper' })).toBeInTheDocument();
  });

  it('calls onManage when buttons are clicked', () => {
    render(<MembershipCard member={activeMember} onManage={mockOnManage} />);
    
    const manageBtn = screen.getByRole('button', { name: /Manage/i });
    fireEvent.click(manageBtn);
    expect(mockOnManage).toHaveBeenCalledWith(activeMember);
    
    const profileBtn = screen.getByRole('button', { name: /View Profile/i });
    fireEvent.click(profileBtn);
    expect(mockOnManage).toHaveBeenLastCalledWith(activeMember);
  });

  it('renders frozen state visual indications', () => {
    const frozenMember = {
      ...activeMember,
      isFrozen: true,
      frozenSince: null,
      freezeUntil: null
    };

    render(<MembershipCard member={frozenMember} onManage={mockOnManage} />);

    expect(screen.getByText(/days? paused until unfrozen/)).toBeInTheDocument();
    // Verify specific frozen styling classes
    const manageBtn = screen.getByRole('button', { name: /Manage/i });
    expect(manageBtn).toHaveClass('text-cyan-600');
  });

  it('renders expired status when expiryDate is in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago
    
    const expiredMember = {
      ...activeMember,
      expiryDate: pastDate.toISOString()
    };
    
    render(<MembershipCard member={expiredMember} onManage={mockOnManage} />);
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('renders list of trainees for a family group membership', () => {
    const familyMember = {
      id: 'family-group',
      name: "Jack's Family",
      plan: 'Family Group (2 Kids)',
      expiryDate: futureDate.toISOString(),
      image: 'https://avatar.com/family',
      isFrozen: false,
      isGroup: true,
      trainees: [
        { id: 2, name: 'Kid 1' },
        { id: 3, name: 'Kid 2' }
      ]
    };
    
    render(<MembershipCard member={familyMember} onManage={mockOnManage} />);
    
    expect(screen.getByText("Jack's Family")).toBeInTheDocument();
    expect(screen.getByText('Kid 1')).toBeInTheDocument();
    expect(screen.getByText('Kid 2')).toBeInTheDocument();
  });

  it('sizes the progress bar from the package duration, not a fixed 30 days', () => {
    const in45 = new Date();
    in45.setDate(in45.getDate() + 45);
    const threeMonthPlan = { id: 3, duration_months: 3, duration_days: null };
    const { rerender } = render(
      <MembershipCard member={{ ...activeMember, expiryDate: toDateKey(in45), planDetails: threeMonthPlan }} onManage={mockOnManage} />
    );
    // 45 of 90 days left = 50%, where the old fixed 30-day bar showed 100%.
    expect(screen.getByTestId('membership-progress')).toHaveStyle({ width: '50%' });

    const yearPlan = { id: 5, duration_months: 12 };
    rerender(<MembershipCard member={{ ...activeMember, expiryDate: toDateKey(in45), planDetails: yearPlan }} onManage={mockOnManage} />);
    expect(screen.getByTestId('membership-progress')).toHaveStyle({ width: '13%' });
  });

  it('shows "No expiry set" when there is no expiry date', () => {
    render(<MembershipCard member={{ ...activeMember, expiryDate: null }} onManage={mockOnManage} />);
    expect(screen.getByText('No expiry set')).toBeInTheDocument();
  });
});
