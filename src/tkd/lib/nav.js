import { BarChart3, CalendarCheck, Home, Settings, Shirt, UserPlus, Users, Wallet } from 'lucide-react';

/** The menu, in two groups: the daily desk jobs first, then running the club. */
export const NAV = [
  { path: '/', key: 'nav.dashboard', icon: Home, mobile: true, group: 'daily' },
  { path: '/students', key: 'nav.students', icon: Users, mobile: true, group: 'daily' },
  { path: '/enrol', key: 'nav.enrol', icon: UserPlus, mobile: true, group: 'daily' },
  { path: '/attendance', key: 'nav.attendance', icon: CalendarCheck, mobile: true, group: 'daily' },
  { path: '/uniforms', key: 'nav.uniforms', icon: Shirt, group: 'manage' },
  { path: '/payments', key: 'nav.payments', icon: Wallet, group: 'manage' },
  { path: '/reports', key: 'nav.reports', icon: BarChart3, group: 'manage' },
  { path: '/settings', key: 'nav.settings', icon: Settings, group: 'manage' },
];

export const isActive = (itemPath, current) => (
  itemPath === '/' ? current === '/' : current.startsWith(itemPath) || (itemPath === '/students' && current.startsWith('/family'))
);

/** Which help text belongs to the page being shown. */
export const helpKeyFor = (path) => {
  if (path.startsWith('/family')) return 'family';
  const item = NAV.find((n) => n.path !== '/' && path.startsWith(n.path));
  return item ? item.path.slice(1) : 'dashboard';
};
