import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemberDetails from '../MemberDetails';
import { apiService } from '../../services/api';

// Mock the apiService module
vi.mock('../../services/api', () => {
  return {
    apiService: {
      getMember: vi.fn(),
      getFamilies: vi.fn()
    }
  };
});

describe('MemberDetails Component', () => {
  const mockOnBack = vi.fn();
  const mockOnUpdateMember = vi.fn();
  const mockOnDeleteMember = vi.fn();

  const mockMember = {
    id: 101,
    name: 'Robert Stark',
    phone: '555-0199',
    parentPhone: null,
    gender: 'Male',
    medicalIssues: 'None',
    planId: 3,
    plan: 'Elite Performance',
    expiryDate: '2026-10-15T00:00:00.000Z',
    isFrozen: false,
    image: 'https://avatar.com/robert',
    messagingOptIn: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiService.getMember.mockResolvedValue(mockMember);
    apiService.getFamilies.mockResolvedValue([]);
  });

  it('renders initial member data and calls apiService.getMember on mount', async () => {
    render(
      <MemberDetails 
        member={mockMember}
        onBack={mockOnBack}
        onUpdateMember={mockOnUpdateMember}
        onDeleteMember={mockOnDeleteMember}
      />
    );

    // Wait for the name to appear after loading ends
    const nameElements = await screen.findAllByText('Robert Stark');
    expect(nameElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Elite Performance').length).toBeGreaterThan(0);

    // Verify it fetch details on mount
    expect(apiService.getMember).toHaveBeenCalledWith(101);
  });

  it('calls onBack when back button is clicked', async () => {
    render(
      <MemberDetails 
        member={mockMember}
        onBack={mockOnBack}
        onUpdateMember={mockOnUpdateMember}
        onDeleteMember={mockOnDeleteMember}
      />
    );

    await screen.findAllByText('Robert Stark');

    const backBtnElement = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'button' && element.querySelector('svg');
    });
    fireEvent.click(backBtnElement);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('opens freeze hold configuration modal and calls onUpdateMember on confirm', async () => {
    render(
      <MemberDetails 
        member={mockMember}
        onBack={mockOnBack}
        onUpdateMember={mockOnUpdateMember}
        onDeleteMember={mockOnDeleteMember}
      />
    );

    await screen.findAllByText('Robert Stark');

    // Click freeze membership button
    const freezeBtn = screen.getByRole('button', { name: /Freeze Membership/i });
    fireEvent.click(freezeBtn);

    // Modal should appear
    expect(screen.getByText('Hold Configuration')).toBeInTheDocument();
    expect(screen.getByText('Confirm Hold')).toBeInTheDocument();

    // Click confirm hold
    const confirmBtn = screen.getByRole('button', { name: /Confirm Hold/i });
    fireEvent.click(confirmBtn);

    expect(mockOnUpdateMember).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        isFrozen: true
      })
    );
  });

  it('unfreezes member immediately when membership is frozen', async () => {
    const frozenMember = {
      ...mockMember,
      isFrozen: true
    };
    apiService.getMember.mockResolvedValue(frozenMember);

    render(
      <MemberDetails 
        member={frozenMember}
        onBack={mockOnBack}
        onUpdateMember={mockOnUpdateMember}
        onDeleteMember={mockOnDeleteMember}
      />
    );

    await screen.findAllByText('Robert Stark');

    const unfreezeBtn = screen.getByRole('button', { name: /Unfreeze Membership/i });
    fireEvent.click(unfreezeBtn);

    expect(mockOnUpdateMember).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        isFrozen: false
      })
    );
  });

  it('allows editing profile details and submitting changes', async () => {
    render(
      <MemberDetails 
        member={mockMember}
        onBack={mockOnBack}
        onUpdateMember={mockOnUpdateMember}
        onDeleteMember={mockOnDeleteMember}
      />
    );

    await screen.findAllByText('Robert Stark');

    // Click edit profile
    const editBtn = screen.getByRole('button', { name: /Edit Profile/i });
    fireEvent.click(editBtn);

    // Check edit inputs are populated
    const nameInput = screen.getByPlaceholderText('Full name');
    expect(nameInput).toHaveValue('Robert Stark');

    // Change value
    fireEvent.change(nameInput, { target: { value: 'Robb Stark' } });
    
    // Save changes
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    expect(mockOnUpdateMember).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 101,
        name: 'Robb Stark'
      })
    );
  });

  it('shows delete confirmation and triggers onDeleteMember', async () => {
    render(
      <MemberDetails 
        member={mockMember}
        onBack={mockOnBack}
        onUpdateMember={mockOnUpdateMember}
        onDeleteMember={mockOnDeleteMember}
      />
    );

    await screen.findAllByText('Robert Stark');

    const deleteBtn = screen.getByRole('button', { name: /Delete Member/i });
    fireEvent.click(deleteBtn);

    // Confirm deletion block should appear
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    
    // Click final Delete button
    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmDeleteBtn);

    expect(mockOnDeleteMember).toHaveBeenCalledWith(101);
  });
});
