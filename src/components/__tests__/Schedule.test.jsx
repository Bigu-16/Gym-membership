import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    expect(screen.queryByText('Templates')).not.toBeInTheDocument();
  });

  it('projects recurring templates onto calendar days and shows enrolled trainees when selected', async () => {
    render(
      <Schedule
        sessions={[]}
        scheduleTemplates={mockTemplates}
        members={mockMembers}
        onAddTemplate={mockOnAddTemplate}
        onDeleteTemplate={mockOnDeleteTemplate}
        onUpdateTemplate={mockOnUpdateTemplate}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Switch to month view
    fireEvent.click(screen.getByText('Month'));
    const classBadges = await screen.findAllByText(/Kids Taekwondo/i);
    expect(classBadges.length).toBeGreaterThan(0);

    // Click on the projected session badge to open drawer
    fireEvent.click(classBadges[0]);

    // Drawer should show details, checklist, and enrolled trainees
    expect(screen.getByText('Session Checklist')).toBeInTheDocument();
    expect(screen.getByText('Enrolled Trainees')).toBeInTheDocument();
    expect(screen.getByText('Bran Stark')).toBeInTheDocument();
  });

  it('correctly handles 24h template times and splits overlapping sessions side-by-side in week view', () => {
    const multiTemplates = [
      {
        id: 1,
        className: 'Elite Performance',
        days: 'Mon, Wed, Fri',
        time: '14:00', // 2:00 PM
        capacity: 12
      },
      {
        id: 2,
        className: 'Personal Training',
        days: 'Mon, Tue, Wed, Thu, Fri',
        time: '14:00', // Same time to test collision layout
        capacity: 1
      }
    ];

    render(
      <Schedule
        sessions={[]}
        scheduleTemplates={multiTemplates}
        members={[]}
        onAddTemplate={mockOnAddTemplate}
        onDeleteTemplate={mockOnDeleteTemplate}
        onUpdateTemplate={mockOnUpdateTemplate}
        onUpdateSessionStatus={mockOnUpdateSessionStatus}
      />
    );

    // Both sessions should be rendered
    const eliteCards = screen.getAllByText('Elite Performance');
    const ptCards = screen.getAllByText('Personal Training');
    expect(eliteCards.length).toBeGreaterThan(0);
    expect(ptCards.length).toBeGreaterThan(0);

    // Verify sub-column collision styling: width should be ~50%
    const eliteCardContainer = eliteCards[0].closest('.absolute');
    const ptCardContainer = ptCards[0].closest('.absolute');
    expect(eliteCardContainer).toBeInTheDocument();
    expect(ptCardContainer).toBeInTheDocument();
    expect(eliteCardContainer.style.width).toContain('50%');
    expect(ptCardContainer.style.width).toContain('50%');
  });
});
