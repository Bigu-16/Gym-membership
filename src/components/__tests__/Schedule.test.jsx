import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Schedule from '../Schedule';

const NOW = new Date(2026, 9, 14, 16, 30, 0); // Wednesday, during the 4 PM class

const templates = [
  { id: 1, className: 'Kids Taekwondo', days: 'Mon, Wed, Fri', time: '16:00 - 17:00', capacity: 15, enrolled: 1, trainer: 'Coach Nasser' },
  { id: 2, className: 'Kids Taekwondo', days: 'Mon, Wed', time: '17:00 - 18:00', capacity: 15, enrolled: 0 },
  { id: 3, className: 'Little Kids Karate', days: 'Tue, Thu, Sat', time: '16:00 - 17:00', capacity: 12, enrolled: 1 }
];

const members = [
  { id: 1, name: 'Zaid Example', age: 8, parentName: 'Sara Example', image: 'h.png', enrolledTemplateIds: [1] },
  { id: 2, name: 'Lina Example', age: 3, parentName: 'Sara Example', image: 'm.png', enrolledTemplateIds: [3] }
];

describe('Schedule', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the week with one-hour classes on the right days and 12-hour labels', () => {
    render(<Schedule sessions={[]} scheduleTemplates={templates} members={members} saveSession={vi.fn()} />);

    expect(screen.getAllByText('Kids Taekwondo')).toHaveLength(5); // Mon x2, Wed x2, Fri x1
    expect(screen.getAllByText('Little Kids Karate')).toHaveLength(3);
    expect(screen.getAllByText(/4:00–5:00 PM/).length).toBeGreaterThan(0);
    expect(screen.getByText('4 PM')).toBeInTheDocument();
    expect(screen.queryByText('12 AM')).not.toBeInTheDocument();
  });

  it('opens a class with its enrolled trainees and live time remaining', () => {
    render(<Schedule sessions={[]} scheduleTemplates={templates} members={members} saveSession={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Day' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Kids Taekwondo/ })[0]);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Zaid Example, 8')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Lina/)).not.toBeInTheDocument();
    expect(within(dialog).getByText('30 min')).toBeInTheDocument();
  });

  it('keeps the dialog on the class after it is saved and gets a real id', async () => {
    const saveSession = vi.fn();
    const { rerender } = render(
      <Schedule sessions={[]} scheduleTemplates={templates} members={members} saveSession={saveSession} />
    );
    saveSession.mockImplementation(async (session, changes) => {
      const saved = { ...session, ...changes, id: 900, isProjected: false };
      rerender(<Schedule sessions={[saved]} scheduleTemplates={templates} members={members} saveSession={saveSession} />);
      return saved;
    });

    fireEvent.click(screen.getByRole('button', { name: 'Day' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Kids Taekwondo/ })[0]);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Start class' }));

    await waitFor(() => expect(within(screen.getByRole('dialog')).getByText('In progress')).toBeInTheDocument());
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark completed' })).toBeInTheDocument();
    expect(saveSession).toHaveBeenCalledTimes(1);
  });

  it('opens the timetable editor on the same page when no classes exist yet', () => {
    const onLoadOfficial = vi.fn().mockResolvedValue({ created: 11, total: 11 });
    render(<Schedule sessions={[]} scheduleTemplates={[]} members={[]} saveSession={vi.fn()} timetableActions={{ onLoadOfficial }} />);
    fireEvent.click(screen.getByRole('button', { name: /Load official timetable/i }));
    expect(onLoadOfficial).toHaveBeenCalledTimes(1);
  });

  it('switches between the calendar and the timetable editor', () => {
    render(<Schedule sessions={[]} scheduleTemplates={templates} members={members} saveSession={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Edit timetable/i }));
    expect(screen.getByText('Weekly timetable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.queryByText('Weekly timetable')).not.toBeInTheDocument();
  });
});
