import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        meliBlue: "#2D3277",
        meliYellow: "#FFE600",
        slateBg: "#f8fafc"
      },
      boxShadow: {
        soft: "0 10px 20px rgba(0,0,0,0.05)",
      }
    },
  },
  plugins: [],
} satisfies Config;
