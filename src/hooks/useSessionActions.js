import { useCallback, useState } from 'react';
import { useFeedback } from '../components/common/Feedback';

/**
 * Status and checklist actions for a class session, shared by Dashboard and Schedule.
 * Everything is saved to the backend (no browser-only state); a timetable class that
 * has not been recorded yet becomes a recorded session on its first change.
 * Success messages come from saveSession; failures are reported here.
 */
export const useSessionActions = (saveSession) => {
  const { notify, confirm } = useFeedback();
  const [pending, setPending] = useState(null); // { id, status } of the change being saved

  const run = useCallback(async (session, changes) => {
    if (!saveSession) return null;
    setPending({ id: session.id, status: changes.status || null });
    try {
      return await saveSession(session, changes);
    } catch (err) {
      notify.error(`Could not update ${session.title}: ${err.message}`);
      return null;
    } finally {
      setPending(null);
    }
  }, [saveSession, notify]);

  const setStatus = useCallback(async (session, status) => {
    if (status === 'cancelled') {
      const ok = await confirm({
        title: `Cancel ${session.title}?`,
        message: `The ${session.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} class on ${session.start.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })} will be marked as cancelled. You can reopen it later.`,
        confirmLabel: 'Cancel class',
        cancelLabel: 'Keep class',
        tone: 'danger'
      });
      if (!ok) return null;
    }
    return run(session, { status });
  }, [run, confirm]);

  const toggleItem = useCallback((session, index) => run(session, {
    checklist: (session.checklist || []).map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
  }), [run]);

  const addItem = useCallback((session, text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    const checklist = session.checklist || [];
    const nextId = checklist.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
    return run(session, { checklist: [...checklist, { id: nextId, text: trimmed, checked: false }] });
  }, [run]);

  const removeItem = useCallback((session, index) => run(session, {
    checklist: (session.checklist || []).filter((_, i) => i !== index)
  }), [run]);

  return { pendingId: pending?.id ?? null, pendingStatus: pending?.status ?? null, setStatus, toggleItem, addItem, removeItem };
};
