import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MembershipCard from '../MembershipCard';

describe('MembershipCard Component', () => {
  const mockOnManage = vi.fn();
  
  // Set up a base active member
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 15); // 15 days in the future
  
  const activeMember = {
    id: 1,
    name: 'Alice Cooper',
    plan: 'Elite Performance',
    expiryDate: futureDate.toISOString(),
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
      isFrozen: true
    };
    
    render(<MembershipCard member={frozenMember} onManage={mockOnManage} />);
    
    expect(screen.getByText('On Hold (Frozen)')).toBeInTheDocument();
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
});
