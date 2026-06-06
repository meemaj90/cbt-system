import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1a56db", light: "#3b82f6", dark: "#1e40af" },
        accent: { DEFAULT: "#ff6b00", light: "#ff8c38" },
        dark: { 100: "#1e2235", 200: "#1a1d27", 300: "#0f1117", 400: "#252840", border: "#2e3250" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
