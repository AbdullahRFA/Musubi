import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f6f1e8",
        foreground: "#241c16",
        card: "#fffaf3",
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#241c16",
        },
        primary: {
          DEFAULT: "#9a3412",
          foreground: "#fffaf3",
        },
        secondary: {
          DEFAULT: "#3f4f3a",
          foreground: "#f6f1e8",
        },
        muted: {
          DEFAULT: "#efe6d9",
          foreground: "#4a4038",
        },
        accent: {
          DEFAULT: "#ead9c4",
          foreground: "#241c16",
        },
        border: "#d9cbb8",
        destructive: {
          DEFAULT: "#9f1239",
          foreground: "#fffaf3",
        },
        success: {
          DEFAULT: "#3f6212",
          foreground: "#f6f1e8",
        },
        ring: "#9a3412",
      },
      borderRadius: {
        lg: "0.9rem",
        md: "0.7rem",
      },
      minHeight: {
        tap: "3rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(36, 28, 22, 0.06)",
        soft: "0 4px 20px -4px rgba(36, 28, 22, 0.10)",
        lift: "0 14px 34px -10px rgba(36, 28, 22, 0.22)",
        glow: "0 8px 24px -6px rgba(154, 52, 18, 0.40)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(14deg)" },
          "30%": { transform: "rotate(-12deg)" },
          "45%": { transform: "rotate(9deg)" },
          "60%": { transform: "rotate(-6deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        blob: {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(6%, -8%) scale(1.08)" },
          "66%": { transform: "translate(-6%, 6%) scale(0.95)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        "badge-ping": {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        wiggle: "wiggle 0.9s ease-in-out 1",
        blob: "blob 18s ease-in-out infinite",
        "badge-ping": "badge-ping 1s cubic-bezier(0, 0, 0.2, 1) 2",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
