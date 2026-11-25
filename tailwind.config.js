/** @type {import('tailwindcss').Config} */
// Shared by both apps. Colour names point at CSS variables that each app defines in its own
// stylesheet (src/gym.css or src/tkd/tkd.css), and only one of them is loaded at a time.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Gym app (theme-aware, contrast-checked colours, see src/gym.css).
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        violet: 'var(--violet)',
        brand: 'var(--brand)',
        'success-solid': 'var(--success-solid)',
        'warning-solid': 'var(--warning-solid)',
        'danger-solid': 'var(--danger-solid)',
        'info-solid': 'var(--info-solid)',
        'brand-solid': 'var(--brand-solid)',
        luxury: {
          dark: '#0a0a0a',
          slate: '#1a1d23',
          amber: '#fbbf24',
          crimson: '#ef4444',
          glass: 'rgba(255, 255, 255, 0.03)',
          'glass-border': 'rgba(255, 255, 255, 0.1)',
        },
        // Taekwondo app (one navy colour, WCAG AAA, see src/tkd/tkd.css).
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
        // The gym app's font; the taekwondo app sets Noto Sans / Noto Sans Ethiopic in tkd.css.
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.15em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 24, 39, 0.06), 0 1px 3px rgba(17, 24, 39, 0.08)',
        // Taekwondo app (values in src/tkd/tkd.css).
        soft: 'var(--shadow-md)',
        pop: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
