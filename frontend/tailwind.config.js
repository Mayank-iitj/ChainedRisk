/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6366f1', // exact royal violet from image
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3',
        },
        surface: {
          bg: '#f4f6fa',
          card: '#ffffff',
          sidebar: '#ffffff',
          border: '#eef2f6',
          hover: '#f8fafc',
          text: '#1e293b',
          muted: '#64748b',
          light: '#94a3b8',
        }
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'pill': '0 2px 8px rgba(99, 102, 241, 0.25)',
      }
    },
  },
  plugins: [],
}
