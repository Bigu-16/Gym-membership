import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FeedbackProvider, Spinner, useFeedback } from '../common/Feedback';
import { useSessionActions } from '../../hooks/useSessionActions';

const Buttons = ({ onAnswer }) => {
  const { notify, confirm } = useFeedback();
  return (
    <>
      <button type="button" onClick={() => notify.success('Saved.')}>ok</button>
      <button type="button" onClick={() => notify.error('Server said no.')}>fail</button>
      <button type="button" onClick={async () => onAnswer(await confirm({ title: 'Delete it?', message: 'Gone for good.', confirmLabel: 'Delete', tone: 'danger' }))}>ask</button>
    </>
  );
};

describe('feedback messages and confirmations', () => {
  afterEach(() => vi.useRealTimers());

  it('shows success messages briefly and keeps errors until dismissed', () => {
    vi.useFakeTimers();
    render(<FeedbackProvider><Buttons onAnswer={vi.fn()} /></FeedbackProvider>);

    fireEvent.click(screen.getByText('ok'));
    fireEvent.click(screen.getByText('fail'));
    expect(screen.getByRole('status')).toHaveTextContent('Saved.');
    expect(screen.getByRole('alert')).toHaveTextContent('Server said no.');

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
    expect(screen.getByText('Server said no.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }));
    expect(screen.queryByText('Server said no.')).not.toBeInTheDocument();
  });

  it('asks before acting and reports the answer', async () => {
    const onAnswer = vi.fn();
    render(<FeedbackProvider><Buttons onAnswer={onAnswer} /></FeedbackProvider>);

    fireEvent.click(screen.getByText('ask'));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete it?' });
    expect(dialog).toHaveTextContent('Gone for good.');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(false));

    fireEvent.click(screen.getByText('ask'));
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(2));
    expect(onAnswer).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByText('ask'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onAnswer).toHaveBeenLastCalledWith(true));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('labels loading spinners for screen readers', () => {
    render(<Spinner label="Saving…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });
});

const CancelClass = ({ saveSession }) => {
  const actions = useSessionActions(saveSession);
  const session = { id: 1, title: 'Kids Karate', start: new Date(2026, 9, 21, 17), status: 'scheduled' };
  return <button type="button" onClick={() => actions.setStatus(session, 'cancelled')}>cancel class</button>;
};

describe('class actions', () => {
  it('asks before cancelling a class, and reports failures', async () => {
    const saveSession = vi.fn().mockRejectedValue(new Error('offline'));
    render(<FeedbackProvider><CancelClass saveSession={saveSession} /></FeedbackProvider>);

    fireEvent.click(screen.getByText('cancel class'));
    expect(screen.getByRole('alertdialog', { name: 'Cancel Kids Karate?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep class' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(saveSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('cancel class'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel class' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update Kids Karate: offline');
    expect(saveSession).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), { status: 'cancelled' });
  });
});
