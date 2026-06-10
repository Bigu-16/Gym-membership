// Shared design tokens — mirrors the app's dark-mode CSS variables exactly

export const THEME = {
  bgPrimary:    '#0a0a0a',
  bgSecondary:  '#121212',
  textPrimary:  '#ffffff',
  textSecondary:'#94a3b8',
  accent:       '#34d399',
  accentDim:    'rgba(52,211,153,0.12)',
  glassBg:      'rgba(255,255,255,0.03)',
  glassBorder:  'rgba(255,255,255,0.10)',
  cardHover:    'rgba(255,255,255,0.05)',
  font:         "'Montserrat', 'Inter', sans-serif",
};

export const MEMBERS = [
  { id: 1, name: 'Alexander Rossi', plan: 'Elite Performance', initials: 'AR', daysLeft: 15 },
  { id: 2, name: 'Elena Vance',     plan: 'Wellness Pro',      initials: 'EV', daysLeft: 5  },
  { id: 3, name: 'Marcus Thorne',   plan: 'Diamond Access',    initials: 'MT', daysLeft: 2  },
  { id: 4, name: 'Sophia Chen',     plan: 'Elite Performance', initials: 'SC', daysLeft: 25 },
  { id: 5, name: 'Julian Drax',     plan: 'Wellness Pro',      initials: 'JD', daysLeft: 6  },
  { id: 6, name: 'Isabella Saint',  plan: 'Diamond Access',    initials: 'IS', daysLeft: 1  },
];

export const SESSIONS = [
  { title: 'Elite Performance', trainer: 'Marcus Thorne', location: 'Studio A – Main Floor', status: 'in-progress', time: '14:00 – 15:30' },
  { title: 'Personal Training', trainer: 'Elena Vance',   location: 'VIP Zone – Sector 4',   status: 'upcoming',    time: '10:00 – 11:30' },
  { title: 'Yoga Flow',         trainer: 'Sophia Chen',   location: 'Zen Garden',             status: 'upcoming',    time: '16:30 – 18:00' },
];

export const PLAN_COLOR = {
  'Elite Performance': '#a78bfa',
  'Wellness Pro':      '#34d399',
  'Diamond Access':    '#fbbf24',
};
