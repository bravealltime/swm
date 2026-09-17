/** @type {import('tailwindcss').Config} */
import animate from 'tailwindcss-animate';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        swgt: {
          bg: '#0b1017',
          card: '#131b26',
          cardHover: '#182332',
          surface: '#1c2738',
          border: '#233044',
          borderLight: '#2e415d',
          accent: '#1d68bd',
          accentHover: '#257ae2',
        }
      },
      fontFamily: {
        thai: ['"IBM Plex Sans Thai"', '"Noto Sans Thai"', 'sans-serif'],
        sans: ['Inter', '"IBM Plex Sans Thai"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      lineHeight: {
        'thai-relaxed': '1.65',
        'thai-normal': '1.5',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out both',
      },
    },
  },
  plugins: [animate],
}
