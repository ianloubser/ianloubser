module.exports = {
  mode: "jit",
  darkMode: "selector", // or 'media' or 'class'
  theme: {
    extend: {
      container: {
        center: true,
      },
    },
  },
  variants: {},
  content: ["./src/**/*.{md,njk,sass}"],
  plugins: [
    require('@tailwindcss/typography')
  ],
};
