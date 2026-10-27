/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F6F2EC',
        marble: '#FBF9F6',
        stone: '#E7E0D5',
        sand: '#D6CBBB',
        taupe: '#A3968A',
        warm: '#6F675F',
        charcoal: '#1D1B19',
        ink: '#121110',
        brown: '#3A2D24',
        bronze: '#9A7A55',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        caps: ['Marcellus', '"Cormorant Garamond"', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { wide2: '0.18em', wide3: '0.28em' },
      transitionTimingFunction: { lux: 'cubic-bezier(.22,.8,.2,1)' },
    },
  },
  plugins: [],
};
