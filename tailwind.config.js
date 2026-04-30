/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          dark: '#0a0a0a',
          slate: '#1a1d23',
          amber: '#fbbf24',
          crimson: '#ef4444',
          glass: 'rgba(255, 255, 255, 0.03)',
          'glass-border': 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        luxury: '0.15em',
      }
    },
  },
  plugins: [],
}
