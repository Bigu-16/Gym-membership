import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TemplateManagement from '../TemplateManagement';

const plan = {
  id: 10,
  name: 'Taekwondo One Month - 3 Classes',
  program: 'Taekwondo',
  duration_label: 'One Month',
  duration_months: 1,
  classes_per_week: 3,
  price: '350.00',
  currency: 'AED',
  included_items: [],
  description: null,
  duration_days: 30,
  sort_order: 1,
  is_active: true
};

const schedule = {
  id: 7,
  className: 'Kids Taekwondo',
  type: 'group',
  days: 'Mon, Wed, Fri',
  time: '4:00 PM - 5:00 PM',
  capacity: 15
};

const renderPage = (overrides = {}) => {
  const props = {
    membershipPlans: [plan],
    scheduleTemplates: [schedule],
    onAddPlan: vi.fn().mockResolvedValue({}),
    onUpdatePlan: vi.fn().mockResolvedValue({}),
    onDeletePlan: vi.fn().mockResolvedValue({}),
    onAddScheduleTemplate: vi.fn().mockResolvedValue({}),
    onUpdateScheduleTemplate: vi.fn().mockResolvedValue({}),
    onDeleteScheduleTemplate: vi.fn().mockResolvedValue({}),
    ...overrides
  };
  render(<TemplateManagement {...props} />);
  return props;
};

describe('TemplateManagement', () => {
  it('shows backend package templates and saves edits through plan API handler', async () => {
    const props = renderPage();

    expect(screen.getByText('Taekwondo One Month - 3 Classes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    fireEvent.change(screen.getByLabelText('Price (AED)'), { target: { value: '375' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Package' }));

    await waitFor(() => expect(props.onUpdatePlan).toHaveBeenCalledWith(expect.objectContaining({
      id: 10,
      price: 375,
      program: 'Taekwondo'
    })));
  });

  it('renders photo-style Monday-Saturday engine and edits recurring slots', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Weekly Schedule/i }));

    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
    fireEvent.click(screen.getAllByRole('button', { name: /Kids Taekwondo/i })[0]);
    expect(screen.getByText('Edit Template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('16:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument();
  });

  it('loads all missing photo schedule slots through backend create handler', async () => {
    const onAddScheduleTemplate = vi.fn().mockResolvedValue({});
    renderPage({ scheduleTemplates: [], onAddScheduleTemplate });
    fireEvent.click(screen.getByRole('button', { name: /Weekly Schedule/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Load Photo Schedule' }));

    await waitFor(() => expect(onAddScheduleTemplate).toHaveBeenCalledTimes(11));
    expect(onAddScheduleTemplate).toHaveBeenCalledWith(expect.objectContaining({
      className: 'Little Kids Karate',
      days: 'Tue, Thu, Sat',
      type: 'group'
    }));
  });

  it('loads missing official packages without recreating configured ones', async () => {
    const onAddPlan = vi.fn().mockResolvedValue({});
    renderPage({ onAddPlan });
    fireEvent.click(screen.getByRole('button', { name: 'Load Official Packages' }));

    await waitFor(() => expect(onAddPlan).toHaveBeenCalledTimes(14));
    expect(onAddPlan).not.toHaveBeenCalledWith(expect.objectContaining({
      program: 'Taekwondo',
      duration_months: 1,
      classes_per_week: 3
    }));
    expect(onAddPlan).toHaveBeenCalledWith(expect.objectContaining({
      program: 'Kickboxing',
      duration_months: 3,
      classes_per_week: 3,
      price: 900,
      included_items: ['Free gloves']
    }));
  });
});
