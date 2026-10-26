import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import EnrollmentForm from '../EnrollmentForm';

const plan = (id, program, overrides = {}) => ({
  id,
  name: `${program} 1 Month - 3 Classes`,
  program,
  duration_label: '1 month',
  duration_months: 1,
  duration_days: null,
  classes_per_week: 3,
  price: '350.00',
  currency: 'AED',
  included_items: [],
  description: '',
  is_active: true,
  sort_order: id,
  ...overrides
});

const plans = [
  plan(1, 'Taekwondo'),
  plan(2, 'Karate'),
  plan(3, 'Karate', { name: 'Karate 3 Months', duration_label: '3 months', duration_months: 3, price: '900.00', included_items: ['Free uniform'] }),
  plan(4, 'Fitness', { is_active: false, name: 'Retired Fitness' })
];

const templates = [
  { id: 10, className: 'Kids Taekwondo', type: 'group', days: 'Mon, Wed, Fri', time: '16:00 - 17:00', capacity: 15, enrolled: 3 },
  { id: 11, className: 'Little Kids Karate', type: 'group', days: 'Tue, Thu, Sat', time: '16:00 - 17:00', capacity: 12, enrolled: 1 },
  { id: 12, className: 'Kids Karate', type: 'group', days: 'Tue, Thu, Sat', time: '17:00 - 18:00', capacity: 15, enrolled: 15 },
  { id: 13, className: 'Adult Karate', type: 'group', days: 'Tue, Thu, Sat', time: '20:00 - 21:00', capacity: 15, enrolled: 4 }
];

const renderForm = (props = {}) =>
  render(
    <EnrollmentForm
      onEnroll={vi.fn().mockResolvedValue({ members: [], warnings: [] })}
      scheduleTemplates={templates}
      membershipPlans={plans}
      onLoadOfficialPackages={vi.fn()}
      {...props}
    />
  );

const change = (element, value) => fireEvent.change(element, { target: { value } });
const submit = () => {
  const terms = screen.getByLabelText(/agrees to these rules and regulations/i);
  if (!terms.checked) fireEvent.click(terms);
  fireEvent.click(screen.getByRole('button', { name: /Confirm Enrollment/i }));
};

const fillChild = (card, { name, age }) => {
  change(within(card).getByLabelText('Full name'), name);
  change(within(card).getByLabelText('Age'), age);
};

describe('EnrollmentForm', () => {
  it('registers two children under one parent without inventing sibling phone numbers', async () => {
    const onEnroll = vi.fn().mockResolvedValue({ members: [{ id: 1, name: 'Leo Smith' }, { id: 2, name: 'Mia Smith' }], warnings: [] });
    renderForm({ onEnroll });

    change(screen.getByLabelText('Parent/guardian full name'), 'John Smith');
    change(screen.getByLabelText('Parent/guardian mobile'), '+971 50 123 4567');
    // The sibling starts on the same package as the first child.
    change(within(screen.getByTestId('trainee-card')).getByLabelText('Package'), '2');
    fireEvent.click(screen.getByRole('button', { name: 'Add sibling' }));

    const [first, second] = screen.getAllByTestId('trainee-card');
    fillChild(first, { name: 'Leo Smith', age: '3' });
    fillChild(second, { name: 'Mia Smith', age: '9' });

    // Age 3 on a Karate package -> Little Kids Karate is suggested; the full class is disabled.
    fireEvent.click(within(first).getByLabelText(/Little Kids Karate, Tue, Thu, Sat/));
    expect(within(second).getByLabelText(/Kids Karate, Tue, Thu, Sat, 5:00 PM/)).toBeDisabled();
    expect(within(second).queryByLabelText(/Little Kids Karate/)).not.toBeInTheDocument();
    fireEvent.click(within(second).getByRole('button', { name: 'Show all classes' }));
    fireEvent.click(within(second).getByLabelText(/Kids Taekwondo, Mon, Wed, Fri/));
    fireEvent.click(within(second).getByLabelText(/Adult Karate/));

    submit();

    await waitFor(() => expect(onEnroll).toHaveBeenCalledTimes(1));
    const registration = onEnroll.mock.calls[0][0];
    expect(registration.parent).toEqual({ name: 'John Smith', phone: '+971 50 123 4567', email: null });
    expect(registration.trainees).toHaveLength(2);
    expect(registration.trainees[0]).toEqual({
      name: 'Leo Smith',
      age: 3,
      gender: 'Male',
      planId: 2,
      payment: { amount: 350, method: 'cash' },
      templateIds: [11],
      termsAccepted: true
    });
    expect(registration.trainees[1].templateIds).toEqual([10, 13]);
    registration.trainees.forEach((t) => {
      expect(t.phone).toBeUndefined();
      expect(t.expiryDate).toBeUndefined();
    });

    expect(await screen.findByText('Enrollment successful')).toBeInTheDocument();
  });

  it('registers an adult without a parent and requires their own phone', async () => {
    const onEnroll = vi.fn().mockResolvedValue({ members: [{ id: 5, name: 'Sara Ali' }], warnings: ['Sara Ali was registered but not added to Adult Karate: full'] });
    renderForm({ onEnroll });

    fireEvent.click(screen.getByRole('button', { name: 'Adult (registers themself)' }));
    expect(screen.queryByLabelText('Parent/guardian full name')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add sibling' })).not.toBeInTheDocument();

    const card = screen.getByTestId('trainee-card');
    change(within(card).getByLabelText('Full name'), 'Sara Ali');
    change(within(card).getByLabelText('Age'), '29');
    change(within(card).getByLabelText('Gender'), 'Female');
    change(within(card).getByLabelText('Package'), '3');

    submit();
    expect(await screen.findByText(/mobile number is required/i)).toBeInTheDocument();
    expect(onEnroll).not.toHaveBeenCalled();

    change(within(card).getByLabelText(/^Mobile/), '+971501112222');
    change(within(card).getByLabelText('Emirates ID (optional)'), '784-1995-1234567-1');
    fireEvent.click(within(card).getByLabelText('Yes'));
    change(within(card).getByLabelText('Medical details'), 'Asthma');
    change(screen.getByLabelText('Payment method'), 'card');
    change(screen.getByLabelText('Amount paid for Sara Ali'), '850');

    submit();
    await waitFor(() => expect(onEnroll).toHaveBeenCalledTimes(1));
    const registration = onEnroll.mock.calls[0][0];
    expect(registration.parent).toBeNull();
    expect(registration.trainees[0]).toEqual({
      name: 'Sara Ali',
      age: 29,
      gender: 'Female',
      phone: '+971501112222',
      whatsappNumber: '+971501112222',
      emiratesId: '784-1995-1234567-1',
      medicalIssues: 'Asthma',
      planId: 3,
      payment: { amount: 850, method: 'card' },
      templateIds: [],
      termsAccepted: true
    });

    expect(await screen.findByText('Enrollment successful')).toBeInTheDocument();
    expect(screen.getByText(/not added to Adult Karate/)).toBeInTheDocument();
  });

  it('defaults the payment amount to the selected package price', () => {
    renderForm();
    change(screen.getByLabelText('Package'), '3');
    expect(screen.getByLabelText('Amount paid for trainee 1')).toHaveValue(900);
    expect(screen.getByLabelText('Payment method')).toHaveValue('cash');
    expect(screen.getAllByText(/Free uniform/).length).toBeGreaterThan(0);
  });

  it('keeps the form and shows the error inline when registration fails', async () => {
    const onEnroll = vi.fn().mockRejectedValue(new Error('phone: phone number already registered'));
    renderForm({ onEnroll });

    change(screen.getByLabelText('Parent/guardian full name'), 'John Smith');
    change(screen.getByLabelText('Parent/guardian mobile'), '+971501234567');
    change(screen.getByLabelText('Package'), '1');
    fillChild(screen.getByTestId('trainee-card'), { name: 'Leo Smith', age: '8' });

    submit();

    expect(await screen.findByText('phone: phone number already registered')).toBeInTheDocument();
    expect(screen.queryByText('Enrollment successful')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Full name')).toHaveValue('Leo Smith');
  });

  it('only shows success after onEnroll resolves', async () => {
    let resolve;
    const onEnroll = vi.fn(() => new Promise((r) => { resolve = r; }));
    renderForm({ onEnroll });

    change(screen.getByLabelText('Parent/guardian full name'), 'John Smith');
    change(screen.getByLabelText('Parent/guardian mobile'), '+971501234567');
    change(screen.getByLabelText('Package'), '1');
    fillChild(screen.getByTestId('trainee-card'), { name: 'Leo Smith', age: '8' });
    submit();

    await waitFor(() => expect(onEnroll).toHaveBeenCalled());
    expect(screen.queryByText('Enrollment successful')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Saving/ })).toBeDisabled();

    resolve({ members: [{ id: 1, name: 'Leo Smith' }], warnings: [] });
    expect(await screen.findByText('Enrollment successful')).toBeInTheDocument();
  });

  it('requires agreement to the registration-form terms', async () => {
    const onEnroll = vi.fn().mockResolvedValue({ members: [], warnings: [] });
    renderForm({ onEnroll });
    expect(screen.getByText(/All activity fees are non-refundable/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirm Enrollment/i }));
    expect(await screen.findByText(/must agree to the center's terms/i)).toBeInTheDocument();
    expect(onEnroll).not.toHaveBeenCalled();
  });

  it('only offers group packages (no personal training)', () => {
    renderForm();
    expect(screen.queryByText(/Personal Training/i)).not.toBeInTheDocument();
  });

  it('clears the form', async () => {
    renderForm();
    change(screen.getByLabelText('Parent/guardian full name'), 'John Smith');
    change(screen.getByLabelText('Full name'), 'Leo Smith');
    fireEvent.click(screen.getByRole('button', { name: 'Add sibling' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear form' }));
    await waitFor(() => expect(screen.getByLabelText('Parent/guardian full name')).toHaveValue(''));
    expect(screen.getAllByTestId('trainee-card')).toHaveLength(1);
    expect(screen.getByLabelText('Full name')).toHaveValue('');
  });
});
