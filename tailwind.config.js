/** @type {import('tailwindcss').Config} */
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
      }
    },
  },
  plugins: [],
}
