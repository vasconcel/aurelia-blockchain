/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aurelia-cyan': '#22d3ee',
        'aurelia-purple': '#c084fc',
        'aurelia-pink': '#f472b6',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'breathe-neon': 'breathe-neon 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}