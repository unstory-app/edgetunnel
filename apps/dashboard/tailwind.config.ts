import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102A43",
        sea: "#0B7285",
        foam: "#E6FCF5",
        sand: "#FAF3DD",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
