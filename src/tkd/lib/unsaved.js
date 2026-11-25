import { useEffect } from 'react';

let dirty = false;
export const hasUnsavedWork = () => dirty;

/** Marks the current page as holding unsaved work, and asks before the tab is closed. */
export function useUnsavedWork(when) {
  useEffect(() => {
    dirty = when;
    if (!when) return undefined;
    const onUnload = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      dirty = false;
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [when]);
}
