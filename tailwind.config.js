/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'dark-navy': '#1a2639',
        'deep-blue': '#0d1b2a',
        'slate-blue': '#2e4057',
        'dark-blue': '#2b3a55',
        'light-pink': '#ff99cc',
        'bright-pink': '#ffaddb',
        'gray-blue': '#a3bffa',
      },
    },
  },
  plugins: [],
};