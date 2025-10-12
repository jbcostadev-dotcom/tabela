/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      width: {
        '75': '300px',
        '37.5': '150px',
        '50': '200px',
        '62.5': '250px',
      },
      height: {
        '19': '75px',
        '15': '60px',
      },
      fontSize: {
        sm: ['0.775rem', { lineHeight: '1.25rem' }],
      }
    },
  },
  plugins: [],
};
