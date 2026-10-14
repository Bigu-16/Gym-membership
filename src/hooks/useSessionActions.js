import { useCallback, useState } from 'react';

/**
 * Status and checklist actions for a class session, shared by Dashboard and Schedule.
 * Everything is saved to the backend (no browser-only state); a timetable class that
 * has not been recorded yet becomes a recorded session on its first change.
 */
export const useSessionActions = (saveSession) => {
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const run = useCallback(async (session, changes) => {
    if (!saveSession) return null;
    setPendingId(session.id);
    setError('');
    try {
      return await saveSession(session, changes);
    } catch (err) {
      setError(`Could not update ${session.title}: ${err.message}`);
      return null;
    } finally {
      setPendingId(null);
    }
  }, [saveSession]);

  const setStatus = useCallback((session, status) => run(session, { status }), [run]);

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

  return { error, clearError: () => setError(''), pendingId, setStatus, toggleItem, addItem, removeItem };
};
