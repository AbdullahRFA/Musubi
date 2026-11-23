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
    },
  },
  plugins: [],
};

export default config;
