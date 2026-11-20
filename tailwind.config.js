/** @type {import('tailwindcss').Config} */
// One main colour (navy). Status colours appear only where they carry meaning (expiry, stock).
// Every text pair meets WCAG AAA 7:1; borders and chart marks meet 3:1 (see src/index.css).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        'brand-hover': 'var(--brand-hover)',
        navy: 'var(--navy)',
        tint: 'var(--tint)',
        page: 'var(--page)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        ok: 'var(--ok)',
        'ok-soft': 'var(--ok-soft)',
        'ok-strong': 'var(--ok-strong)',
        'ok-bar': 'var(--ok-strong)',
        warn: 'var(--warn)',
        'warn-soft': 'var(--warn-soft)',
        'warn-strong': 'var(--warn-strong)',
        'warn-bar': 'var(--warn-strong)',
        crit: 'var(--crit)',
        'crit-soft': 'var(--crit-soft)',
        'crit-strong': 'var(--crit-strong)',
        'crit-bar': 'var(--crit-bar)',
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Ethiopic"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 3px rgba(17, 24, 39, 0.08)',
      },
    },
  },
  plugins: [],
};
