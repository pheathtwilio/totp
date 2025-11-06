/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1976d2',
        'primary-dark': '#1565c0',
        'primary-light': '#2196f3',
        danger: '#F22F46',
        'dark-blue': '#3C425C',
        'light-gray': '#ecedf1',
      },
    },
  },
  plugins: [],
}
