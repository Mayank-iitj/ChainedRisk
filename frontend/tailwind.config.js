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
        soc: {
          base: '#0B0F14',
          surface: '#121821',
          elevated: '#172230',
          border: '#1F2A37',
          borderLight: '#2D3A4B',
          text: '#F1F5F9',
          muted: '#94A3B8',
          subtle: '#64748B',
          accent: '#6366F1',
          cyan: '#06B6D4',
          emerald: '#10B981',
          crimson: '#EF4444',
          amber: '#F59E0B'
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6366f1',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3',
        }
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        'glow-indigo': '0 0 20px -3px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'glow-crimson': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
