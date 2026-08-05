import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Notifications from '../Notifications';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => {
  return {
    apiService: {
      triggerSeedDemoData: vi.fn(),
      triggerMembershipExpiryReminders: vi.fn(),
      triggerProcessNotificationJobs: vi.fn(),
    },
  };
});

describe('Notifications Component', () => {
  const mockOnTriggerTask = vi.fn();
  const mockMembers = [
    { id: 10, name: 'John Doe', phone: '+123456789', image: 'john-img.jpg' },
  ];

  const mockJobs = [
    {
      id: 1,
      member_id: 10,
      notification_type: 'welcome',
      status: 'pending',
      scheduled_for: '2026-08-05T12:00:00.000Z',
      processed_at: null,
      payload: { member_name: 'John Doe', phone: '+123456789' },
      provider: 'internal',
      error_message: null,
      created_at: '2026-08-05T11:00:00.000Z',
      updated_at: '2026-08-05T11:00:00.000Z',
    },
    {
      id: 2,
      member_id: 999, // Unmatched member, will fallback to payload
      notification_type: 'membership_expiry',
      status: 'failed',
      scheduled_for: '2026-08-05T13:00:00.000Z',
      processed_at: '2026-08-05T13:01:00.000Z',
      payload: { member_name: 'Jane Smith', phone: '+987654321' },
      provider: 'twilio',
      error_message: 'SMS provider quota exceeded',
      created_at: '2026-08-05T11:30:00.000Z',
      updated_at: '2026-08-05T13:01:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all metrics cards and rows correctly', () => {
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);

    // Total logs
    expect(screen.getByText('2')).toBeInTheDocument();
    // Processed count (is 0)
    expect(screen.getByText('0')).toBeInTheDocument();
    // Pending and Failed counts are both 1
    const ones = screen.getAllByText('1');
    expect(ones.length).toBeGreaterThanOrEqual(2);

    // Recipient names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Message type tags
    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.getByText('Expiry Alert')).toBeInTheDocument();
  });

  it('filters list of jobs based on status filter selection', () => {
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);

    // Initial check: both John and Jane display
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Change status filter to failed
    const selectElements = screen.getAllByRole('combobox');
    
    // First select is Status, Second is Type
    fireEvent.change(selectElements[0], { target: { value: 'failed' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('filters list of jobs based on search term', () => {
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);

    const searchInput = screen.getByPlaceholderText(/Search member, phone or error.../i);
    
    // Search for "Jane"
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Search for non-existent text
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('opens details modal when a row is clicked and shows details', () => {
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);

    const failedRow = screen.getByText('Jane Smith');
    fireEvent.click(failedRow);

    // Modal should show up
    expect(screen.getByText('Notification Audit Inspector')).toBeInTheDocument();
    expect(screen.getByText('SMS provider quota exceeded')).toBeInTheDocument();
    expect(screen.getByText('twilio')).toBeInTheDocument();
    
    // Close modal by clicking backdrop
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByText('Notification Audit Inspector')).not.toBeInTheDocument();
  });

  it('triggers database seeder task', async () => {
    apiService.triggerSeedDemoData.mockResolvedValueOnce({ status: 'seeded' });
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);

    const seedBtn = screen.getByText('Seed Demo Data');
    fireEvent.click(seedBtn);

    expect(apiService.triggerSeedDemoData).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Demo data seeded successfully!')).toBeInTheDocument();
    });
    expect(mockOnTriggerTask).toHaveBeenCalled();
  });

  it('triggers process notification jobs task', async () => {
    apiService.triggerProcessNotificationJobs.mockResolvedValueOnce({ task_id: 'task-abc-123' });
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);

    const processBtn = screen.getByText('Process Pending Jobs');
    fireEvent.click(processBtn);

    expect(apiService.triggerProcessNotificationJobs).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Task queued successfully! ID: task-abc-123')).toBeInTheDocument();
    });
    expect(mockOnTriggerTask).toHaveBeenCalled();
  });
});
