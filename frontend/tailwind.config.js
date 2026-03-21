/** @type {import('tailwindcss').Config} */
export default {
  // 🔥 ESTA ES LA LÍNEA QUE TE FALTA Y QUE HACE FUNCIONAR EL BOTÓN 🔥
  darkMode: 'class', 
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#1E293B',
      }
    },
  },
  plugins: [],
}