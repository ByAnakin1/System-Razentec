/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB', // Un azul corporativo bonito
        secondary: '#1E293B', // Un gris oscuro para menús
      }
    },
  },
  plugins: [],
}