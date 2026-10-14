import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import MemberDetails from '../MemberDetails';
import { apiService } from '../../services/api';
import { toDateKey } from '../../utils/classSessions';

vi.mock('../../services/api', () => ({
  apiService: { getMember: vi.fn(), getFamilies: vi.fn() }
}));

const plans = [
  { id: 7, name: 'Karate 1 Month - 3 Classes', program: 'Karate', duration_label: '1 month', duration_months: 1, classes_per_week: 3, price: '350.00', currency: 'AED', included_items: [], is_active: true, sort_order: 1 },
  { id: 8, name: 'Karate 3 Months', program: 'Karate', duration_label: '3 months', duration_months: 3, classes_per_week: 3, price: '900.00', currency: 'AED', included_items: ['Free uniform'], is_active: true, sort_order: 2 },
  { id: 9, name: 'Old Promo', program: 'Karate', duration_label: '1 month', duration_months: 1, price: '100.00', currency: 'AED', is_active: false, sort_order: 3 }
];

const templates = [
  { id: 21, className: 'Kids Karate', days: 'Tue, Thu, Sat', time: '17:00 - 18:00', capacity: 15, enrolled: 5 },
  { id: 22, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '20:00 - 21:00', capacity: 15, enrolled: 2 }
];

const daysFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};

const baseMember = {
  id: 101,
  name: 'Robert Stark',
  phone: '+971501110000',
  whatsappNumber: '+971502220000',
  emiratesId: '784-1990-1234567-1',
  email: null,
  parentPhone: null,
  parentName: null,
  familyId: null,
  gender: 'Male',
  age: 34,
  medicalIssues: '',
  planId: 7,
  plan: 'Karate 1 Month - 3 Classes',
  planDetails: plans[0],
  expiryDate: daysFromToday(10),
  isFrozen: false,
  image: 'https://avatar.com/robert',
  messagingOptIn: true,
  enrolledTemplateIds: [22],
  enrolledClasses: [{ id: 22, className: 'Adult Karate', days: 'Tue, Thu, Sat', time: '20:00 - 21:00' }],
  enrolledClass: null
};

const setup = (overrides = {}, props = {}) => {
  const handlers = {
    onBack: vi.fn(),
    onUpdateMember: vi.fn().mockResolvedValue(undefined),
    onDeleteMember: vi.fn().mockResolvedValue(undefined),
    onRenewMember: vi.fn().mockResolvedValue(undefined),
    onSetMemberClasses: vi.fn().mockResolvedValue(undefined),
    ...props
  };
  const member = { ...baseMember, ...overrides };
  render(<MemberDetails member={member} scheduleTemplates={templates} membershipPlans={plans} {...handlers} />);
  return { member, ...handlers };
};

describe('MemberDetails', () => {
  it('renders the member from props without refetching stale data', () => {
    setup();
    expect(screen.getAllByText('Robert Stark').length).toBeGreaterThan(0);
    expect(screen.getByText('10 Days Left')).toBeInTheDocument();
    expect(screen.getByText('+971502220000')).toBeInTheDocument();
    expect(screen.getByText('784-1990-1234567-1')).toBeInTheDocument();
    expect(screen.getByText(/8:00 PM – 9:00 PM/)).toBeInTheDocument();
    expect(apiService.getMember).not.toHaveBeenCalled();
    expect(apiService.getFamilies).not.toHaveBeenCalled();
  });

  it('calls onBack', () => {
    const { onBack } = setup();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('freezes and unfreezes an individual', async () => {
    const { onUpdateMember } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Freeze Membership/i }));
    expect(screen.getByText('Hold Configuration')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirm Hold/i }));
    await waitFor(() => expect(onUpdateMember).toHaveBeenCalledWith(expect.objectContaining({ id: 101, isFrozen: true, expiryDate: baseMember.expiryDate })));
  });

  it('unfreezes immediately when frozen', async () => {
    const { onUpdateMember } = setup({ isFrozen: true });
    fireEvent.click(screen.getByRole('button', { name: /Unfreeze Membership/i }));
    await waitFor(() => expect(onUpdateMember).toHaveBeenCalledWith(expect.objectContaining({ id: 101, isFrozen: false })));
  });

  it('freezes a whole family through the group object', async () => {
    const onUpdateMember = vi.fn().mockResolvedValue(undefined);
    const group = {
      isGroup: true, id: 'family-4', familyId: 4, parentName: 'Ned Stark', parentPhone: '+971500000000', parentEmail: null,
      name: "Ned's Family", plan: 'Family (2 trainees)', image: '', expiryDate: daysFromToday(5), isFrozen: false,
      trainees: [
        { ...baseMember, id: 1, name: 'Arya Stark', phone: null, familyId: 4, parentPhone: '+971500000000', age: 9 },
        { ...baseMember, id: 2, name: 'Bran Stark', phone: null, familyId: 4, parentPhone: '+971500000000', age: 7, planId: 8, planDetails: plans[1] }
      ]
    };
    render(<MemberDetails member={group} membershipPlans={plans} scheduleTemplates={templates} onBack={vi.fn()} onUpdateMember={onUpdateMember} onDeleteMember={vi.fn()} onRenewMember={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Freeze Membership/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Hold/i }));
    await waitFor(() => expect(onUpdateMember).toHaveBeenCalledWith(expect.objectContaining({ isGroup: true, familyId: 4, isFrozen: true })));
  });

  it('edit form lists the real packages and keeps untouched age/plan', async () => {
    const { onUpdateMember } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));

    const planSelect = screen.getByLabelText('Package');
    const options = within(planSelect).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['No package', 'Karate 1 Month - 3 Classes — 350 AED', 'Karate 3 Months — 900 AED']);
    expect(planSelect).toHaveValue('7');
    expect(screen.queryByText(/Elite Performance|Wellness Pro|Starter Access/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('WhatsApp Number')).toHaveValue('+971502220000');
    expect(screen.getByLabelText('Emirates ID (optional)')).toHaveValue('784-1990-1234567-1');

    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Robb Stark' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(onUpdateMember).toHaveBeenCalledTimes(1));
    const saved = onUpdateMember.mock.calls[0][0];
    expect(saved).toEqual(expect.objectContaining({ id: 101, name: 'Robb Stark', age: 34, planId: 7, expiryDate: baseMember.expiryDate, whatsappNumber: '+971502220000' }));
    expect(await screen.findByText('Profile saved.')).toBeInTheDocument();
  });

  it('shows save errors inline instead of alert()', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    setup({}, { onUpdateMember: vi.fn().mockRejectedValue(new Error('phone already registered')) });
    fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    expect(await screen.findByText('phone already registered')).toBeInTheDocument();
    expect(screen.getByLabelText('Package')).toBeInTheDocument(); // still editing
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('deletes after confirmation', async () => {
    const { onDeleteMember } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Delete Member/i }));
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDeleteMember).toHaveBeenCalledWith(101));
  });

  it('renews with the current package, from expiry, paying the package price by default', async () => {
    const { onRenewMember } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Renew Membership/i }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Package')).toHaveValue('7');
    expect(within(dialog).getByLabelText('Amount (AED)')).toHaveValue(350);
    expect(within(dialog).getByRole('button', { name: /After current expiry/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & Renew/i }));
    await waitFor(() => expect(onRenewMember).toHaveBeenCalledTimes(1));
    expect(onRenewMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: 101 }),
      { planId: 7, startFrom: 'expiry', payment: { amount: 350, method: 'cash' } }
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renewal can switch package, start today and change payment', async () => {
    const { onRenewMember } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Renew Membership/i }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Package'), { target: { value: '8' } });
    expect(within(dialog).getByLabelText('Amount (AED)')).toHaveValue(900);
    fireEvent.change(within(dialog).getByLabelText('Amount (AED)'), { target: { value: '800' } });
    fireEvent.change(within(dialog).getByLabelText('Payment Method'), { target: { value: 'bank_transfer' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Today/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & Renew/i }));
    await waitFor(() =>
      expect(onRenewMember).toHaveBeenCalledWith(expect.anything(), { planId: 8, startFrom: 'today', payment: { amount: 800, method: 'bank_transfer' } })
    );
  });

  it('keeps the renewal dialog open with the error when renewal fails', async () => {
    setup({}, { onRenewMember: vi.fn().mockRejectedValue(new Error('Choose a package to renew')) });
    fireEvent.click(screen.getByRole('button', { name: /Renew Membership/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Renew/i }));
    expect(await screen.findByText('Choose a package to renew')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renews each family trainee with their own package', async () => {
    const onRenewMember = vi.fn().mockResolvedValue(undefined);
    const arya = { ...baseMember, id: 1, name: 'Arya Stark', familyId: 4, planId: 7, planDetails: plans[0] };
    const bran = { ...baseMember, id: 2, name: 'Bran Stark', familyId: 4, planId: 8, planDetails: plans[1] };
    const group = { isGroup: true, id: 'family-4', familyId: 4, parentName: 'Ned Stark', parentPhone: '+971500000000', name: "Ned's Family", plan: 'Family', expiryDate: daysFromToday(3), isFrozen: false, trainees: [arya, bran] };
    render(<MemberDetails member={group} membershipPlans={plans} scheduleTemplates={templates} onBack={vi.fn()} onUpdateMember={vi.fn()} onDeleteMember={vi.fn()} onRenewMember={onRenewMember} />);

    fireEvent.click(screen.getByRole('button', { name: /Renew Membership/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Renew/i }));
    await waitFor(() => expect(onRenewMember).toHaveBeenCalledTimes(1));
    const [target, renewal] = onRenewMember.mock.calls[0];
    expect(target).toBe(group);
    expect(typeof renewal).toBe('function');
    expect(renewal(arya)).toEqual({ planId: 7, startFrom: 'expiry', payment: { amount: 350, method: 'cash' } });
    expect(renewal(bran)).toEqual({ planId: 8, startFrom: 'expiry', payment: { amount: 900, method: 'cash' } });
  });

  it('edits class slots', async () => {
    const { onSetMemberClasses } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit classes for Robert Stark' }));
    fireEvent.click(screen.getByRole('button', { name: 'Show all classes' }));
    fireEvent.click(screen.getByLabelText(/Kids Karate, Tue, Thu, Sat/));
    fireEvent.click(screen.getByRole('button', { name: 'Save classes' }));
    await waitFor(() => expect(onSetMemberClasses).toHaveBeenCalledWith(expect.objectContaining({ id: 101 }), [22, 21]));
  });
});
