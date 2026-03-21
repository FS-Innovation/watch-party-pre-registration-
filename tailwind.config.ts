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
        "doac-red": "#E94560",
        "doac-gray": "#AAAAAA",
        "doac-black": "#000000",
        "doac-teal": "#1a6b7a",
        "doac-sand": "#d4a574",
        "doac-surface": "#131313",
        "doac-surface-light": "#1c1b1b",
      },
      fontFamily: {
        headline: ["Epilogue", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
        sans: ["Inter", "Helvetica Neue", "Arial", "sans-serif"],
        script: ["'Beth Ellen'", "cursive"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 1.5s ease-out forwards",
        "fade-in-slow": "fade-in 2s ease-out forwards",
        "slide-up": "slide-up 0.8s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
