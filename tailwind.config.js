/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",    <-- ISSO PROCURA NA RAIZ
    "./*.js",      <-- ISSO PROCURA NA RAIZ
    "./*.{js,ts,jsx,tsx}", // Se tiver outros tipos de arquivo
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
