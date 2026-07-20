import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Schedule from '../Schedule';

describe('Schedule Component', () => {
  const mockOnAddTemplate = vi.fn();
  const mockOnDeleteTemplate = vi.fn();
  const mockOnUpdateTemplate = vi.fn();
  const mockOnUpdateSessionStatus = vi.fn();

  const mockTemplates = [
    {
      id: 1,
      className: 'Kids Taekwondo',
      days: 'Mon, Wed',
      time: '04:00 PM - 05:00 PM',
      capacity: 10,
      enrolled: 2
    }
  ];

  const mockSessions = [
    {
      id: 101,
      title: 'Kids Taekwondo Session',
      trainer: 'Master Kim',
      location: 'Studio B',
      start: new Date(),
      end: new Date(Date.now() + 3600000),
      status: 'upcoming',
      type: 'group',
      checklist: [
        { id: 1, text: 'Warm up', checked: false }
      ]
    }
  ];

  const mockMembers = [
    { id: 1, name: 'Bran Stark', schedule: { slot: 'Kids Taekwondo: Mon, Wed @ 04:00 PM - 05:00 PM' } }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders schedule header and default week view calendars', () => {
    render(
      <Schedule
        sessions={mockSessions}
        scheduleTemplates={mockTemplates}
        members={mockMembers}
        onAddTemplate={mockOnAddTemplate}
        onDeleteTemplate={mockOnDeleteTemplate}
        onUpdateTemplate={mockOnUpdateTemplate}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Should render view select buttons
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('switches to templates view and renders active templates list', () => {
    render(
      <Schedule
        sessions={mockSessions}
        scheduleTemplates={mockTemplates}
        members={mockMembers}
        onAddTemplate={mockOnAddTemplate}
        onDeleteTemplate={mockOnDeleteTemplate}
        onUpdateTemplate={mockOnUpdateTemplate}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Switch to templates view
    const templatesTab = screen.getByText('Templates');
    fireEvent.click(templatesTab);

    // Verify template details appear
    expect(screen.getByText('Active Class Templates')).toBeInTheDocument();
    expect(screen.getAllByText('Kids Taekwondo').length).toBeGreaterThan(0);
    expect(screen.getByText('Mon, Wed')).toBeInTheDocument();
    expect(screen.getByText('04:00 PM - 05:00 PM')).toBeInTheDocument();
  });

  it('opens create template modal, submits form and triggers onAddTemplate callback', async () => {
    render(
      <Schedule
        sessions={mockSessions}
        scheduleTemplates={mockTemplates}
        members={mockMembers}
        onAddTemplate={mockOnAddTemplate}
        onDeleteTemplate={mockOnDeleteTemplate}
        onUpdateTemplate={mockOnUpdateTemplate}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Switch to templates view
    const templatesTab = screen.getByText('Templates');
    fireEvent.click(templatesTab);

    // Click "Create Template" button
    const createBtn = screen.getByRole('button', { name: /Create Template/i });
    fireEvent.click(createBtn);

    // Modal should display form fields
    expect(screen.getByText('Class / Session Name')).toBeInTheDocument();
    
    // Choose Wed day option (Wednesday day option)
    const wednesdayPill = screen.getByText('Wed');
    fireEvent.click(wednesdayPill);

    // Submit template creation
    const submitBtn = screen.getAllByRole('button', { name: /Create Template/i })[1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnAddTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          className: 'Kids Taekwondo',
          days: 'Wed',
          capacity: 15
        })
      );
    });
  });

  it('opens delete confirmation modal and triggers onDeleteTemplate callback', async () => {
    render(
      <Schedule
        sessions={mockSessions}
        scheduleTemplates={mockTemplates}
        members={mockMembers}
        onAddTemplate={mockOnAddTemplate}
        onDeleteTemplate={mockOnDeleteTemplate}
        onUpdateTemplate={mockOnUpdateTemplate}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Go to templates view
    fireEvent.click(screen.getByText('Templates'));

    // Trigger delete clicking trash button
    const deleteBtn = screen.getByTitle('Delete Template');
    fireEvent.click(deleteBtn);

    // Confirm dialog should appear
    expect(screen.getByText('Delete Template Slot?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnDeleteTemplate).toHaveBeenCalledWith(1);
    });
  });
});
