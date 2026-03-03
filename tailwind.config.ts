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
        navy: {
          DEFAULT: "#0d0d43",
          light: "#1a1a5e",
          dark: "#0a0a35",
        },
        cyan: {
          DEFAULT: "#00e5ff",
        },
        muted: "#c0c0e0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "neon": "0 0 15px #00e5ff55",
        "neon-strong": "0 0 20px #00e5ff88, 0 0 40px #00e5ff33",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 15px #00e5ff55" },
          "50%": { boxShadow: "0 0 25px #00e5ff88, 0 0 50px #00e5ff33" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
