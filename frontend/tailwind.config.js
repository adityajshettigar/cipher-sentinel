/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quantum: {
          900: '#0B1120', // Deepest background
          800: '#111827', // Card background
          700: '#1F2937', // Hover states
          accent: '#06B6D4', // Cyan primary
          alert: '#EF4444', // Red critical
          safe: '#10B981', // Emerald safe
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}