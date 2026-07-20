import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Analytics from '../Analytics';

describe('Analytics Component', () => {
  const mockMembers = [
    { id: 1, name: 'Alice', plan: 'Elite Performance' },
    { id: 2, name: 'Bob', plan: 'Wellness Pro' },
    { id: 3, name: 'Charlie', plan: 'Diamond Access' }
  ];

  const mockTemplates = [
    { id: 1, className: 'Yoga Flow', enrolled: 8, capacity: 10 }
  ];

  it('calculates and renders correct metrics totals based on members list', () => {
    render(<Analytics members={mockMembers} scheduleTemplates={mockTemplates} />);

    // Total monthly revenue should sum up:
    // Elite Performance (250) + Wellness Pro (150) + Diamond Access (400) = 800
    expect(screen.getByText(/800/)).toBeInTheDocument();
    
    // Average check-ins per day: members.length (3) * 0.72 = 2.16 -> rounded to 2.2
    expect(screen.getByText('2.2')).toBeInTheDocument();

    // Standard static metrics
    expect(screen.getByText('4.94')).toBeInTheDocument(); // Rating
    expect(screen.getByText('98.2%')).toBeInTheDocument(); // Retention
  });

  it('renders SVG charts: Donut chart and Bezier growth chart', () => {
    const { container } = render(<Analytics members={mockMembers} scheduleTemplates={mockTemplates} />);

    // Check SVG elements are rendered in the DOM
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);

    // Should render Plan distribution names
    expect(screen.getByText('Elite Performance')).toBeInTheDocument();
    expect(screen.getByText('Wellness Pro')).toBeInTheDocument();
    expect(screen.getByText('Diamond Access')).toBeInTheDocument();
  });

  it('allows clicking different occupancy heatmap zones', () => {
    render(<Analytics members={mockMembers} scheduleTemplates={mockTemplates} />);

    // Find zone selectors (e.g. Zen Garden)
    const zenGardenBtn = screen.getByRole('button', { name: 'Zen Garden' });
    expect(zenGardenBtn).toBeInTheDocument();

    // Click it to trigger state update
    fireEvent.click(zenGardenBtn);

    // Verify it applies active classes
    expect(zenGardenBtn).toHaveClass('bg-[var(--text-primary)]');
  });

  it('renders class trainer performance leaderboard', () => {
    render(<Analytics members={mockMembers} scheduleTemplates={mockTemplates} />);

    // Leaderboard should display Yoga Flow and the calculated trainer
    expect(screen.getByText('Yoga Flow')).toBeInTheDocument();
    expect(screen.getByText('Sophia Chen')).toBeInTheDocument(); // Mapped from Yoga Flow
    expect(screen.getByText(/80%/)).toBeInTheDocument(); // Enrollment ratio text (8 / 10 = 80%)
  });
});
