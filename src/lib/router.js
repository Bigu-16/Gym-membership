import { useEffect, useState } from 'react';

const parse = () => {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, search = ''] = raw.split('?');
  return { path: path || '/', params: Object.fromEntries(new URLSearchParams(search)) };
};

export const navigate = (to) => {
  window.location.hash = to.startsWith('#') ? to : `#${to}`;
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
