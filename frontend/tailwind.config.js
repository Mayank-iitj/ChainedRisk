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
        mono: {
          950: '#000000',
          900: '#0A0A0A',
          850: '#121212',
          800: '#181818',
          700: '#262626',
          600: '#3A3A3A',
          500: '#525252',
          400: '#737373',
          300: '#A3A3A3',
          200: '#D4D4D4',
          100: '#E5E5E5',
          50: '#F5F5F5',
          white: '#FFFFFF',
        },
        soc: {
          base: '#000000',
          surface: '#0A0A0A',
          elevated: '#141414',
          border: '#262626',
          borderLight: '#404040',
          text: '#FFFFFF',
          muted: '#A3A3A3',
          subtle: '#737373',
          accent: '#FFFFFF',
          cyan: '#E5E5E5',
          emerald: '#FFFFFF',
          crimson: '#FFFFFF',
          amber: '#E5E5E5'
        }
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.9)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.95)',
        'glow-white': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
        'glow-indigo': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
        'glow-emerald': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
        'glow-crimson': '0 0 20px -3px rgba(255, 255, 255, 0.25)',
      }
    },
  },
  plugins: [],
}
