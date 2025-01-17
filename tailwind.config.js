/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        khaki: {
          300: '#e8e6e1',
          400: '#d4d1c7',
          500: '#f0ece6',
        }
      },
      boxShadow: {
        'neumorphic': '5px 5px 10px #d1cdc4, -5px -5px 10px #ffffff',
        'neumorphic-hover': '7px 7px 14px #d1cdc4, -7px -7px 14px #ffffff',
      }
    },
  },
  plugins: [],
}