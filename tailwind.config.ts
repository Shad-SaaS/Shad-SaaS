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
        store: {
          bg: "#020412",
          card: "#060922",
          cardHover: "#0a1038",
          primary: "#0061fe",
          primaryHover: "#1a73e8",
          accent: "#00d2ff",
          border: "rgba(255, 255, 255, 0.08)",
          glass: "rgba(255, 255, 255, 0.04)",
          gold: "#f59e0b",
        },
      },
      fontFamily: {
        tajawal: ["Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
