/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          bg: "#160405",
          burgundy: "#260707",
          surface: "#310b0b",
          accent: "#5c1717",
          cta: "#ff4f45",
          ctaHover: "#ff6b5f",
          cream: "#fff8f2",
          text: "#fff7ef",
          muted: "#d8b8a8",
          cardText: "#1f1414",
        },
        crimson: {
          bg: "#160405",
          surface: "#310b0b",
          accent: "#5c1717",
          gold: "#ff4f45",
          pale: "#d8b8a8",
        },
        primary: {
          50: "#fff1ed",
          100: "#ffd8d2",
          200: "#ffaaa0",
          500: "#ff6b5f",
          600: "#ff4f45",
          700: "#d8b8a8",
        },
        secondary: "#ff6b5f",
        sky: "#260707",
        soft: "#160405",
        navy: "#160405",
        dark: "#fff7ef",
        muted: "#d8b8a8",
        line: "rgba(255, 95, 80, 0.22)",
        success: "#22c55e",
        warning: "#d8945a",
        danger: "#ff6b6b",
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
