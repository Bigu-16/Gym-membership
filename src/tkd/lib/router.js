import { useEffect, useState } from 'react';

const parse = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  return { path: path || '/', params: Object.fromEntries(new URLSearchParams(search)) };
};

const pathOf = (href) => href.replace(/^#/, '').split('?')[0] || '/';

// A page with unsaved work registers a guard; it returns true to hold the navigation
// (it then asks the user, and calls forceNavigate if they choose to leave).
let guard = null;
export const setNavigationGuard = (fn) => { guard = fn; };

/** True when leaving for `href` should be held for a "leave without saving?" question. */
export const shouldHold = (href) => Boolean(guard) && pathOf(href) !== parse().path && guard(href);

export const forceNavigate = (to) => {
  window.location.hash = to.startsWith('#') ? to : `#${to}`;
};

export const navigate = (to) => {
  const href = to.startsWith('#') ? to : `#${to}`;
  if (shouldHold(href)) return;
  forceNavigate(href);
};

export const useRoute = () => {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
};
