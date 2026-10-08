import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RegistrationFormTemplateModal from '../enrollment/RegistrationFormTemplateModal';
import EnrollmentForm from '../EnrollmentForm';
import { GROUP_SCHEDULE_SLOTS } from '../../config/scheduleConfig';

describe('Registration Form Template & Data Population', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders official registration template modal with N & T branding and timetable matrix', () => {
    const mockData = {
      name: 'Ahmed Al Mansoori',
      age: '7',
      gender: 'Male',
      phone: '0501234567',
      parentName: 'Salem Al Mansoori',
      service: 'Kids Taekwondo',
      slot: 'Kids Taekwondo: Mon, Wed, Fri @ 5:00 PM - 6:00 PM',
      date: '2026-10-08'
    };

    render(
      <RegistrationFormTemplateModal
        isOpen={true}
        onClose={mockOnClose}
        data={mockData}
      />
    );

    // Header & Title
    expect(screen.getAllByText(/N & T TAEKWONDO AND KARATE CENTER/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/REGISTRATION FORM/i).length).toBeGreaterThan(0);

    // Member information
    expect(screen.getByText('Ahmed Al Mansoori')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getAllByText('0501234567').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Salem Al Mansoori').length).toBeGreaterThan(0);

    // Medical condition & schedule
    expect(screen.getByText('Do you have any medical condition?')).toBeInTheDocument();
    expect(screen.getByText('Weekly Training Schedule Timetable')).toBeInTheDocument();

    // Verify timetable columns and classes
    expect(screen.getByText('MONDAY')).toBeInTheDocument();
    expect(screen.getByText('TUESDAY')).toBeInTheDocument();
    expect(screen.getByText('WEDNESDAY')).toBeInTheDocument();
    expect(screen.getByText('THURSDAY')).toBeInTheDocument();
    expect(screen.getByText('FRIDAY')).toBeInTheDocument();
    expect(screen.getByText('SATURDAY')).toBeInTheDocument();
    expect(screen.getAllByText(/Kids Taekwondo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Little Kids Karate/i).length).toBeGreaterThan(0);

    // Activities & disclaimer
    expect(screen.getByText(/Activities & Pricing Packages/i)).toBeInTheDocument();
    expect(screen.getAllByText(/As per N & T TEAKWONDO&KARATE CENTER Management:/i).length).toBeGreaterThan(0);

    // Close button
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows clicking View Official Template from EnrollmentForm toolbar to view timetable', () => {
    const mockOnEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={GROUP_SCHEDULE_SLOTS} />);

    // Check toolbar buttons
    const templateBtn = screen.getByRole('button', { name: /View Official Template/i });
    expect(templateBtn).toBeInTheDocument();

    // Click to open modal
    fireEvent.click(templateBtn);
    expect(screen.getAllByText(/Official Registration Template/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Weekly Training Schedule Timetable/i)).toBeInTheDocument();
  });

  it('starts with an empty form with no Mouza pre-filled data', () => {
    const mockOnEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={GROUP_SCHEDULE_SLOTS} />);

    // Verify that parent inputs and kid inputs are empty
    const parentNameInput = screen.getByPlaceholderText(/e\.g\. John Doe/i);
    expect(parentNameInput.value).toBe('');

    const kidNameInput = screen.getByPlaceholderText(/e\.g\. Leo Smith/i);
    expect(kidNameInput.value).toBe('');

    const ageInput = screen.getByPlaceholderText('Age');
    expect(ageInput.value).toBe('');

    // Ensure Mouza's information is not present
    expect(screen.queryByDisplayValue('Mouza Almuharrami')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Safeya Almuharrami')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Fill Mouza Almuharrami/i })).not.toBeInTheDocument();
  });

  it('allows filling the form and resetting it back to empty with Reset Form button', () => {
    const mockOnEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={GROUP_SCHEDULE_SLOTS} />);

    const parentNameInput = screen.getByPlaceholderText(/e\.g\. John Doe/i);
    const kidNameInput = screen.getByPlaceholderText(/e\.g\. Leo Smith/i);
    const ageInput = screen.getByPlaceholderText('Age');

    // Fill form
    fireEvent.change(parentNameInput, { target: { value: 'Fatima Al Ali' } });
    fireEvent.change(kidNameInput, { target: { value: 'Rashid Al Ali' } });
    fireEvent.change(ageInput, { target: { value: '8' } });

    expect(parentNameInput.value).toBe('Fatima Al Ali');
    expect(kidNameInput.value).toBe('Rashid Al Ali');
    expect(ageInput.value).toBe('8');

    // Click Reset Form
    const resetBtn = screen.getByRole('button', { name: /Reset Form/i });
    fireEvent.click(resetBtn);

    // Form inputs should be empty again
    expect(screen.getByPlaceholderText(/e\.g\. John Doe/i).value).toBe('');
    expect(screen.getByPlaceholderText(/e\.g\. Leo Smith/i).value).toBe('');
    expect(screen.getByPlaceholderText('Age').value).toBe('');
  });

  it('does not display inline Show Template toggle or inline Timetable Grid on the form', () => {
    const mockOnEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={GROUP_SCHEDULE_SLOTS} />);

    // "Show Template on Form" toggle should not exist
    expect(screen.queryByRole('button', { name: /Show Template on Form/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Official Center Template Sheet Preview/i)).not.toBeInTheDocument();

    // Timetable grid header should not be on the form (only in template modal)
    expect(screen.queryByText(/Interactive schedule table from the official registration template/i)).not.toBeInTheDocument();
  });

  it('resets the form after submission completes', () => {
    vi.useFakeTimers();
    const mockOnEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={GROUP_SCHEDULE_SLOTS} />);

    const parentNameInput = screen.getByPlaceholderText(/e\.g\. John Doe/i);
    const kidNameInput = screen.getByPlaceholderText(/e\.g\. Leo Smith/i);
    const ageInput = screen.getByPlaceholderText('Age');

    // Fill in details
    fireEvent.change(parentNameInput, { target: { value: 'Mariam Al Shehhi' } });
    fireEvent.change(kidNameInput, { target: { value: 'Sultan Al Shehhi' } });
    fireEvent.change(ageInput, { target: { value: '10' } });

    // Submit the form
    const submitBtn = screen.getByRole('button', { name: /Confirm Enrollment/i });
    fireEvent.click(submitBtn);

    expect(mockOnEnroll).toHaveBeenCalled();
    expect(screen.getByText(/Enrollment Successful/i)).toBeInTheDocument();

    // Fast-forward 3s transition back to the form
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Form is back and reset to empty
    const newParentInput = screen.getByPlaceholderText(/e\.g\. John Doe/i);
    const newKidInput = screen.getByPlaceholderText(/e\.g\. Leo Smith/i);
    expect(newParentInput.value).toBe('');
    expect(newKidInput.value).toBe('');

    vi.useRealTimers();
  });
});
