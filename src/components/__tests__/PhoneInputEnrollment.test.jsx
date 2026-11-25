import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import PhoneInputField, { UAE_ISO2 } from '../enrollment/PhoneInputField';
import EnrollmentForm from '../EnrollmentForm';

describe('PhoneInputField Component', () => {
  it('defaults to the UAE (+971) country code', () => {
    const Harness = () => {
      const [val, setVal] = useState('');
      return (
        <div>
          <label htmlFor="test-phone">Mobile Phone</label>
          <PhoneInputField id="test-phone" value={val} onChange={setVal} />
        </div>
      );
    };

    render(<Harness />);
    const input = screen.getByLabelText('Mobile Phone');
    // UAE dial code is prefilled in the input
    expect(input.value).toBe('+971 ');

    const countryBtn = screen.getByLabelText('Country selector');
    expect(countryBtn).toBeInTheDocument();
    expect(countryBtn).toHaveAttribute('data-country', UAE_ISO2);
  });

  it('allows choosing a different country code', () => {
    let captured = '';
    const Harness = () => {
      const [val, setVal] = useState('');
      return (
        <div>
          <label htmlFor="test-phone">Mobile Phone</label>
          <PhoneInputField
            id="test-phone"
            value={val}
            onChange={(phone) => {
              captured = phone;
              setVal(phone);
            }}
          />
        </div>
      );
    };

    render(<Harness />);
    const countryBtn = screen.getByLabelText('Country selector');
    fireEvent.click(countryBtn);

    // Select United States (+1)
    const usOption = screen.getByText('United States');
    fireEvent.click(usOption);

    const input = screen.getByLabelText('Mobile Phone');
    expect(input.value).toBe('+1 ');
    expect(countryBtn).toHaveAttribute('data-country', 'us');

    // Type a US phone number
    fireEvent.change(input, { target: { value: '+1 202 555 0199' } });
    expect(captured).toBe('+12025550199');
  });

  it('enforces a limit on phone number length (no overflow past mask)', () => {
    let captured = '';
    const Harness = () => {
      const [val, setVal] = useState('');
      return (
        <div>
          <label htmlFor="test-phone">Mobile Phone</label>
          <PhoneInputField
            id="test-phone"
            value={val}
            onChange={(phone) => {
              captured = phone;
              setVal(phone);
            }}
          />
        </div>
      );
    };

    render(<Harness />);
    const input = screen.getByLabelText('Mobile Phone');

    // UAE phone numbers have 9 subscriber digits (e.g. 50 123 4567).
    // Attempting to type extra digits beyond the 9-digit limit is blocked.
    fireEvent.change(input, { target: { value: '+971 50 123 4567 89999' } });
    expect(input.value).toBe('+971 50 123 4567');
    expect(captured).toBe('+971501234567');
  });

  it('reports empty string when only country dial code is present', () => {
    let captured = 'initial';
    const Harness = () => {
      const [val, setVal] = useState('');
      return (
        <div>
          <label htmlFor="test-phone">Mobile Phone</label>
          <PhoneInputField
            id="test-phone"
            value={val}
            onChange={(phone) => {
              captured = phone;
              setVal(phone);
            }}
          />
        </div>
      );
    };

    render(<Harness />);
    const input = screen.getByLabelText('Mobile Phone');

    // Type a digit
    fireEvent.change(input, { target: { value: '+971 5' } });
    expect(captured).toBe('+9715');

    // Delete the digit back to just dial code
    fireEvent.change(input, { target: { value: '+971 ' } });
    expect(captured).toBe('');
  });
});

describe('EnrollmentForm phone country code and limit integration', () => {
  const dummyPlan = {
    id: 1,
    name: 'Karate 1 Month',
    program: 'Karate',
    price: '300',
    currency: 'AED',
    classes_per_week: 2,
    is_active: true
  };

  it('provides country code picker for parent mobile with UAE default', async () => {
    render(
      <EnrollmentForm
        onEnroll={vi.fn()}
        membershipPlans={[dummyPlan]}
        scheduleTemplates={[]}
      />
    );

    const parentPhoneInput = screen.getByLabelText('Parent/guardian mobile');
    expect(parentPhoneInput).toBeInTheDocument();
    expect(parentPhoneInput.value).toBe('+971 ');

    // Parent country selector defaults to UAE
    const countryButtons = screen.getAllByLabelText('Country selector');
    expect(countryButtons[0]).toHaveAttribute('data-country', 'ae');
  });

  it('provides country code picker and limits adult trainee phone', async () => {
    const onEnroll = vi.fn().mockResolvedValue({ members: [] });
    render(
      <EnrollmentForm
        onEnroll={onEnroll}
        membershipPlans={[dummyPlan]}
        scheduleTemplates={[]}
      />
    );

    // Switch to adult registration
    fireEvent.click(screen.getByRole('button', { name: 'Adult (registers themself)' }));

    const card = screen.getByTestId('trainee-card');
    const mobileInput = within(card).getByLabelText(/^Mobile/);
    expect(mobileInput.value).toBe('+971 ');

    // Type into mobile input with excess digits to verify limit
    fireEvent.change(mobileInput, { target: { value: '+971 55 987 6543 12345' } });
    expect(mobileInput.value).toBe('+971 55 987 6543');

    // Fill the rest of required fields
    fireEvent.change(within(card).getByLabelText('Full name'), { target: { value: 'Alex Adult' } });
    fireEvent.change(within(card).getByLabelText('Age'), { target: { value: '25' } });
    fireEvent.change(within(card).getByLabelText('Package'), { target: { value: '1' } });
    fireEvent.click(screen.getByLabelText(/agrees to these rules and regulations/i));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Enrollment/i }));

    await waitFor(() => expect(onEnroll).toHaveBeenCalledTimes(1));
    const payload = onEnroll.mock.calls[0][0];
    expect(payload.trainees[0].phone).toBe('+971559876543');
  });

  it('provides country code picker for WhatsApp number when not same as mobile', () => {
    render(
      <EnrollmentForm
        onEnroll={vi.fn()}
        membershipPlans={[dummyPlan]}
        scheduleTemplates={[]}
      />
    );

    const card = screen.getByTestId('trainee-card');
    const checkbox = within(card).getByLabelText('WhatsApp same as mobile');
    expect(checkbox).toBeChecked();

    // Uncheck "WhatsApp same as mobile"
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    const whatsappInput = within(card).getByLabelText('WhatsApp number');
    expect(whatsappInput).toBeInTheDocument();
    expect(whatsappInput.value).toBe('+971 ');

    // Type with overflow to verify limit
    fireEvent.change(whatsappInput, { target: { value: '+971 50 111 2233 9999' } });
    expect(whatsappInput.value).toBe('+971 50 111 2233');
  });
});
