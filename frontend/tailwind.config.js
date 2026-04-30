/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'spin': 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin for hiding scrollbars
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      };
      addUtilities(newUtilities);
    },
  ],
  safelist: [
    // sessionModal dynamic classes
    'opacity-0', 'opacity-100',
    'translate-y-0', 'translate-y-3',
    'scale-100', 'scale-[0.97]',
    { pattern: /^(bg|border|stroke)-(orange|red|blue|amber|rose|sky)-(400|500)/ },
    { pattern: /\/(10|20)$/ },
    'from-orange-500', 'via-orange-400', 'to-amber-400',
    'from-red-500', 'via-red-400', 'to-rose-400',
    'from-blue-500', 'via-blue-400', 'to-sky-300',
  ],
};