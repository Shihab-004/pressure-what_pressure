import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        tech: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        spider: {
          crimson: "#E50914",
          scarlet: "#FF2A2A",
          darkred: "#880808",
          charcoal: "#0A0C10",
          obsidian: "#060709",
          border: "#1D2232",
          webline: "rgba(229, 9, 20, 0.15)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-crimson": "0 0 25px -3px rgba(229, 9, 20, 0.4)",
        "glow-crimson-lg": "0 0 45px -5px rgba(229, 9, 20, 0.55)",
        "spider-hud": "0 0 0 1px rgba(229, 9, 20, 0.25), 0 8px 30px rgba(0, 0, 0, 0.8)",
        "spider-card": "0 1px 0 0 rgba(255, 255, 255, 0.08) inset, 0 14px 40px -10px rgba(0, 0, 0, 0.85)",
      },
      keyframes: {
        spiderPulse: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 10px rgba(229, 9, 20, 0.6))" },
          "50%": { opacity: "0.6", filter: "drop-shadow(0 0 2px rgba(229, 9, 20, 0.2))" },
        },
        radarScan: {
          "0%": { transform: "scale(0.95)", opacity: "0.9" },
          "50%": { transform: "scale(1.2)", opacity: "0.3" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        webGlow: {
          "0%, 100%": { opacity: "0.08" },
          "50%": { opacity: "0.15" },
        },
      },
      animation: {
        "spider-pulse": "spiderPulse 2.5s ease-in-out infinite",
        "radar-scan": "radarScan 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "web-glow": "webGlow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
