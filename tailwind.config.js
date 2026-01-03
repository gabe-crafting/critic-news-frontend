/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Enable JIT mode for better performance
  mode: 'jit',
  // Only include used classes in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      "./src/**/*.{html,ts}",
    ],
  },
}
