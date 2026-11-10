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
          50: '#FFF0F3',
          100: '#FFE1E8',
          200: '#FFC2D1',
          300: '#FF94B1',
          400: '#FF5983',
          500: '#E83D6F',
          600: '#D4265A',
          700: '#B21946',
          800: '#94173D',
          900: '#7D1737',
        },
        plum: {
          900: '#2D1420',
          800: '#462536',
          700: '#5F394D',
          600: '#7C4F67',
          500: '#9C6984',
          400: '#BC88A4',
          300: '#DBADC6',
          200: '#F0D3E2',
          100: '#FAECF3',
          50: '#FDF7FA',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(232, 61, 111, 0.06)',
        'glow': '0 0 25px rgba(232, 61, 111, 0.25)',
        'card': '0 4px 20px rgba(45, 20, 32, 0.04)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
