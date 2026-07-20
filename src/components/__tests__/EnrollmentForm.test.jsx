import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EnrollmentForm from '../EnrollmentForm';

describe('EnrollmentForm Component', () => {
  const mockOnEnroll = vi.fn();
  const mockTemplates = [
    { id: 1, className: 'Taekwondo', days: 'Mon, Wed, Fri', time: '04:00 PM - 05:00 PM', capacity: 10, enrolled: 2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders enrollment wizard layout', () => {
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={mockTemplates} />);

    // Check headings
    expect(screen.getByText('Select Training Program')).toBeInTheDocument();
    expect(screen.getAllByText(/Group Training/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Personal Training/i).length).toBeGreaterThan(0);
  });

  it('allows filling parent and trainee information and submitting group enrollment', async () => {
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={mockTemplates} />);

    // Select Group Training slot (preset slot Mon, Wed, Fri)
    const slotPill = screen.getByText('Mon, Wed, Fri');
    fireEvent.click(slotPill);

    // Fill parent fields
    const parentNameInput = screen.getByPlaceholderText('e.g. John Doe');
    fireEvent.change(parentNameInput, { target: { value: 'Papa Stark' } });

    // Fill trainee fields
    const traineeNameInput = screen.getByPlaceholderText('e.g. Leo Smith');
    fireEvent.change(traineeNameInput, { target: { value: 'Bran Stark' } });

    const traineeAgeInput = screen.getByPlaceholderText('Age');
    fireEvent.change(traineeAgeInput, { target: { value: '12' } });

    // Submit form (the button contains text "Confirm Enrollment")
    const submitBtn = screen.getByRole('button', { name: /Confirm Enrollment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnEnroll).toHaveBeenCalledTimes(1);
      // Success screen should be visible
      expect(screen.getByText('Enrollment Successful')).toBeInTheDocument();
    });
  });

  it('toggles training styles and enables personal training timing options', async () => {
    render(<EnrollmentForm onEnroll={mockOnEnroll} scheduleTemplates={mockTemplates} />);

    // Find the Personal Training button container/card and click it
    const ptHeading = screen.getByRole('heading', { name: 'Personal Training' });
    fireEvent.click(ptHeading.closest('button'));

    // After switching, PT specific scheduling fields should appear (e.g. Preferred Area)
    expect(screen.getByText('Training Location / Preferred Area')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Member's Villa/i)).toBeInTheDocument();
  });
});
