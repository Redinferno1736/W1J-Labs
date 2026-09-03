/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#ED1B24",
          redDeep: "#B4101F",
          ink: "#0B0B0C",
          paper: "#F6F5F2",
          bone: "#EDEBE6",
        },
      },
      fontFamily: {
        wordmark: ["var(--font-wordmark)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        caption: ["var(--font-caption)", "serif"],
      },
      transitionTimingFunction: {
        "editorial": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
};
