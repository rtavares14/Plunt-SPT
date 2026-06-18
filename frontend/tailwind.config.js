/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  important: '#root',
  theme: {
    extend: {
      colors: {
        'cream-main': '#ECE7DC',
        'cream-soft': '#FAF7EF',
        'olive-main': '#405035',
        'olive-light': '#5B6952',
        'olive-opac': 'rgba(91, 105, 82, 0.5)',
        'accent-red': '#DC2626',
        'accent-green': '#16A34A',
        'accent-clay': '#B0543C',
        'note-yellow': '#F3DB73',
        'note-pink': '#F0BCC8',
        'note-blue': '#AFCFE6',
        'note-green': '#C2DC9E',
      },
      fontFamily: {
        lateef: ['Lateef', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
