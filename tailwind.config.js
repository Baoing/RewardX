/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        shopify: {
          primary: "#008060",
          hover: "#006e52"
        }
      }
    }
  },
  plugins: []
}


