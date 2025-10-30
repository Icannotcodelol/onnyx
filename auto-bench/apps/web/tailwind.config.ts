import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...fontFamily.sans]
      },
      colors: {
        brand: {
          50: "#f3f5ff",
          100: "#e6e9ff",
          200: "#c5cfff",
          300: "#9aaaff",
          400: "#6b7dff",
          500: "#3c4fff",
          600: "#2a39e6",
          700: "#1f2abc",
          800: "#15208f",
          900: "#0e165f"
        }
      },
      animation: {
        pulseSlow: "pulse 6s ease-in-out infinite"
      }
    }
  },
  plugins: [animate]
};

export default config;
