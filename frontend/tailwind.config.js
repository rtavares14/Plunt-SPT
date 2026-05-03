/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: "#root",
  theme: {
    extend: {
      colors: {
        cream:          '#ebe1d3',
        'cream-paper':  '#f6efe1',
        'cream-mist':   '#fbf6ec',
        'green-main':   '#14532d',
        'green-second': '#0f7033',
        'green-light':  '#2e7d52',
        'green-mist':   '#e7f3ec',
        bark:           '#5a4a36',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        atelier:
          '0 30px 60px -25px rgba(20, 83, 45, 0.35), 0 12px 24px -12px rgba(20, 83, 45, 0.18)',
        leaf: '0 6px 18px -6px rgba(20, 83, 45, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 320ms ease-out both',
      },
    },
  },
  plugins: [],
};
