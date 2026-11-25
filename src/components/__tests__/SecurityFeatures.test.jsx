import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ErrorBoundary from '../common/ErrorBoundary';
import AccountModal from '../layout/AccountModal';
import ActivityLog from '../ActivityLog';
import { passwordProblem } from '../../utils/passwords';
import { validateRegistration } from '../enrollment/enrollmentHelpers';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiService: {
    reportClientError: vi.fn(),
    changePassword: vi.fn(),
    logoutEverywhere: vi.fn(),
    getAuditLogs: vi.fn()
  }
}));

const Broken = () => {
  throw new Error('boom');
};

describe('error boundary', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

  it('shows a recovery message instead of a blank app, reports the crash, and resets on navigation', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="schedule" page="schedule"><Broken /></ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong on this page');
    expect(apiService.reportClientError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom', page: 'schedule' }));

    rerender(<ErrorBoundary resetKey="members" page="members"><p>Members page</p></ErrorBoundary>);
    expect(screen.getByText('Members page')).toBeInTheDocument();
  });
});

describe('account', () => {
  const user = { full_name: 'Desk Staff', email: 'staff@example.com', role: 'staff' };

  it('applies the same password rules as the server', () => {
    expect(passwordProblem('short1A')).toMatch(/10 characters/);
    expect(passwordProblem('alllowercase1')).toMatch(/upper- and lower-case/);
    expect(passwordProblem('FrontDesk2026')).toBeNull();
  });

  it('changes the password and checks the confirmation first', async () => {
    apiService.changePassword.mockResolvedValue(true);
    render(<AccountModal currentUser={user} onClose={vi.fn()} onSignedOut={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'OldDesk2026x' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'FrontDesk2026' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'FrontDesk2027' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('do not match');
    expect(apiService.changePassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'FrontDesk2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    await waitFor(() => expect(apiService.changePassword).toHaveBeenCalledWith('OldDesk2026x', 'FrontDesk2026'));
    expect(await screen.findByRole('status')).toHaveTextContent('signed out');
  });

  it('signs out on all devices', async () => {
    apiService.logoutEverywhere.mockResolvedValue();
    const onSignedOut = vi.fn();
    render(<AccountModal currentUser={user} onClose={vi.fn()} onSignedOut={onSignedOut} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign out on all devices' }));
    await waitFor(() => expect(onSignedOut).toHaveBeenCalled());
  });
});

describe('activity log', () => {
  it('lists who changed what and filters by type', async () => {
    apiService.getAuditLogs.mockResolvedValue([
      { id: 2, created_at: '2026-10-15T10:00:00Z', actor_email: 'admin@example.com', summary: 'Renewed Lina Example on Karate One Month - 3 Classes', action: 'member_renewed' }
    ]);
    render(<ActivityLog />);

    expect(await screen.findByText(/Renewed Lina Example/)).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'payment' } });
    await waitFor(() => expect(apiService.getAuditLogs).toHaveBeenLastCalledWith({ entity_type: 'payment', limit: 300 }));
  });
});

describe('enrollment email validation', () => {
  it('rejects malformed email addresses', () => {
    const plansById = new Map([[1, { id: 1, price: '350.00' }]]);
    const trainee = { key: 1, name: 'Lina Example', age: '3', gender: 'Female', phone: '', email: 'lina@', whatsappSameAsMobile: true, emiratesId: '', hasMedical: false, planId: 1, templateIds: [], amount: null };
    const errors = validateRegistration({
      registrant: 'child',
      parent: { name: 'Sara Example', phone: '+971500000100', email: 'sara-at-example' },
      trainees: [trainee],
      plansById,
      termsAccepted: true
    });
    expect(errors).toEqual([
      'Parent/guardian email address is not valid.',
      'Lina Example: email address is not valid.'
    ]);
  });
});
