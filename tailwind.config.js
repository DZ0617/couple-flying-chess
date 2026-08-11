/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#FF375F',
          purple: '#BF5AF2',
          blue: '#0A84FF',
          gold: '#FFD60A',
          orange: '#FF9F0A',
          teal: '#64D2FF',
          green: '#30D158',
          red: '#FF453A',
        },
        surface: {
          1: '#1C1C1E',
          2: '#2C2C2E',
          3: '#3A3A3C',
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
