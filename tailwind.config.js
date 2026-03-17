/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#fbbf24', // amber-400
          dark: '#d97706',    // amber-600
          light: '#fde68a',   // amber-200
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#d6d3d1',
            a: { color: '#fbbf24' },
            h1: { color: '#e7e5e4', fontFamily: 'Mansalva, cursive' },
            h2: { color: '#e7e5e4', fontFamily: 'Mansalva, cursive' },
            h3: { color: '#e7e5e4', fontFamily: 'Mansalva, cursive' },
            strong: { color: '#e7e5e4' },
            code: { color: '#fbbf24', backgroundColor: '#292524' },
            blockquote: { borderLeftColor: '#fbbf24', color: '#a8a29e' },
            hr: { borderColor: '#44403c' },
          },
          light: {
            css: {
              color: '#292524',
              a: { color: '#d97706' },
              h1: { color: '#1c1917', fontFamily: 'Mansalva, cursive' },
              h2: { color: '#1c1917', fontFamily: 'Mansalva, cursive' },
              h3: { color: '#1c1917', fontFamily: 'Mansalva, cursive' },
              strong: { color: '#1c1917' },
              code: { color: '#d97706', backgroundColor: '#f5f5f4' },
              blockquote: { borderLeftColor: '#d97706', color: '#78716c' },
              hr: { borderColor: '#d6d3d1' },
            },
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
    fontFamily: {
      Manrope: "Manrope, sans-serif",
      Mansalva: "Mansalva, sans-serif",
      Rubik: "Rubik, sans-serif",
    },

  },
  plugins: [],
}