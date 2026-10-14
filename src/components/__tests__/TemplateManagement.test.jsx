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
    onLoadOfficialTimetable: vi.fn().mockResolvedValue({ created: 0, total: 11 }),
    ...overrides
  };
  render(<TemplateManagement {...props} />);
  return props;
};

describe('TemplateManagement', () => {
  it('displays only schedule templates and does not show package templates or pricing', () => {
    renderPage();

    // The templates page must contain schedule information
    expect(screen.getByText(/Shift Schedule Templates/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Weekly Schedule/i })).toBeInTheDocument();

    // Package templates and pricing info must NOT be on the templates page
    expect(screen.queryByText('Taekwondo One Month - 3 Classes')).not.toBeInTheDocument();
    expect(screen.queryByText('Load Official Packages')).not.toBeInTheDocument();
    expect(screen.queryByText(/Package Templates/i)).not.toBeInTheDocument();
    expect(screen.queryByText('350.00')).not.toBeInTheDocument();
  });

  it('renders shift schedule Monday-Saturday engine and edits recurring slots', () => {
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

  it('loads the official timetable through the backend and never shows sample slots as real ones', async () => {
    const onLoadOfficialTimetable = vi.fn().mockResolvedValue({ created: 11, total: 11 });
    renderPage({ scheduleTemplates: [], onLoadOfficialTimetable });

    expect(screen.getByText(/No classes saved yet/i)).toBeInTheDocument();
    expect(screen.queryAllByTitle('Delete schedule template')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: /Load official timetable/i }));
    await waitFor(() => expect(onLoadOfficialTimetable).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/11 missing class slots added/i)).toBeInTheDocument();
  });

  it('saves edited times in 24h form with the coach', async () => {
    const onUpdateScheduleTemplate = vi.fn().mockResolvedValue({});
    renderPage({ onUpdateScheduleTemplate });
    fireEvent.click(screen.getAllByRole('button', { name: /Kids Taekwondo/i })[0]);
    fireEvent.change(screen.getByLabelText(/Coach/i), { target: { value: 'Coach Nasser' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(onUpdateScheduleTemplate).toHaveBeenCalledWith(expect.objectContaining({
      id: 7,
      time: '16:00 - 17:00',
      trainer: 'Coach Nasser'
    })));
  });

  it('rejects an end time before the start time', async () => {
    const onUpdateScheduleTemplate = vi.fn();
    renderPage({ onUpdateScheduleTemplate });
    fireEvent.click(screen.getAllByRole('button', { name: /Kids Taekwondo/i })[0]);
    fireEvent.change(screen.getByDisplayValue('17:00'), { target: { value: '15:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('End time must be after the start time.');
    expect(onUpdateScheduleTemplate).not.toHaveBeenCalled();
  });

  it('allows deleting a schedule template with confirmation modal', async () => {
    const onDeleteScheduleTemplate = vi.fn().mockResolvedValue({});
    renderPage({ onDeleteScheduleTemplate });

    const deleteButtons = screen.getAllByTitle('Delete schedule template');
    expect(deleteButtons.length).toBeGreaterThan(0);
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Delete template?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onDeleteScheduleTemplate).toHaveBeenCalledWith(7));
  });
});
