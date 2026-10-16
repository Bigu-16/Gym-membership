import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Notifications from '../Notifications';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => {
  return {
    apiService: {
      triggerSeedDemoData: vi.fn(),
      getReminderSettings: vi.fn().mockResolvedValue({
        reminder_days: [5, 3], email_configured: true, from_email: 'desk@example.com', scheduler_enabled: false, members_without_email: 2
      }),
      sendDueReminders: vi.fn(),
      sendTestEmail: vi.fn(),
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

  it('shows whether automatic reminders will work', async () => {
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);
    expect(screen.getByText(/5 and 3 days/)).toBeInTheDocument();
    expect(await screen.findByText(/sending from desk@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/daily run is not switched on yet/)).toBeInTheDocument();
    expect(screen.getByText(/2 member\(s\) have no email address/)).toBeInTheDocument();
  });

  it('sends due reminders now and refreshes the log', async () => {
    apiService.sendDueReminders.mockResolvedValueOnce({ members_due: 3, emails_queued: 2, members_without_contact: 1 });
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send due reminders now' }));
    expect(await screen.findByText('2 reminder email(s) sent for 3 member(s) due. 1 had no email address.')).toBeInTheDocument();
    expect(mockOnTriggerTask).toHaveBeenCalled();
  });

  it('sends a test email and shows server errors plainly', async () => {
    apiService.sendTestEmail.mockRejectedValueOnce(new Error('The email server refused the message: auth failed'));
    render(<Notifications jobs={mockJobs} members={mockMembers} onTriggerTask={mockOnTriggerTask} />);
    fireEvent.change(screen.getByLabelText('Send a test email to'), { target: { value: 'owner@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send test email' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('auth failed');
    expect(apiService.sendTestEmail).toHaveBeenCalledWith('owner@example.com');
  });
});
