import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EnrollmentForm from '../EnrollmentForm';
import { PACKAGE_TEMPLATES } from '../../config/scheduleConfig';

describe('photo-backed enrollment package templates', () => {
  it('contains only packages visible in the supplied N & T price sheet', () => {
    expect(PACKAGE_TEMPLATES).toHaveLength(15);
    expect(new Set(PACKAGE_TEMPLATES.map((item) => item.program))).toEqual(new Set([
      'Taekwondo',
      'Kickboxing',
      'Karate',
      'Kung Fu',
      'Fitness'
    ]));

    for (const program of ['Taekwondo', 'Kickboxing', 'Karate', 'Kung Fu', 'Fitness']) {
      expect(PACKAGE_TEMPLATES.filter((item) => item.program === program)).toEqual([
        expect.objectContaining({ durationMonths: 1, classesPerWeek: 2, price: 300 }),
        expect.objectContaining({ durationMonths: 1, classesPerWeek: 3, price: 350 }),
        expect.objectContaining({ durationMonths: 3, classesPerWeek: 3, price: 900 })
      ]);
    }

    expect(PACKAGE_TEMPLATES.some((item) => [800, 1400, 1450, 2550].includes(item.price))).toBe(false);
    expect(PACKAGE_TEMPLATES.find((item) => item.id === 'taekwondo-3m-3x').includedItem).toBe('Free uniform');
    expect(PACKAGE_TEMPLATES.find((item) => item.id === 'kickboxing-3m-3x').includedItem).toBe('Free gloves');
    expect(PACKAGE_TEMPLATES.find((item) => item.id === 'karate-3m-3x').includedItem).toBe('Free uniform');
  });

  it('renders selectable package cards and removes fabricated official tables', () => {
    render(<EnrollmentForm onEnroll={vi.fn()} scheduleTemplates={[]} />);

    expect(screen.getByRole('heading', { name: 'Package Templates' })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Select Taekwondo, 1 month, 2 classes per week, 300 AED'
    })).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Select Fitness, 3 months, 3 classes per week, 900 AED'
    })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View Official Template/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Weekly Training Schedule Timetable/i)).not.toBeInTheDocument();
    expect(screen.queryByText('2550')).not.toBeInTheDocument();
  });

  it('uses selected package as enrollment price and duration', () => {
    const onEnroll = vi.fn();
    render(<EnrollmentForm onEnroll={onEnroll} scheduleTemplates={[]} />);

    fireEvent.click(screen.getByRole('button', {
      name: 'Select Kickboxing, 3 months, 3 classes per week, 900 AED'
    }));

    expect(screen.getByDisplayValue('900')).toBeInTheDocument();
    expect(screen.getAllByText('Free gloves').length).toBeGreaterThan(0);
  });
});
