import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
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
        // Custom CFE semantic colors
        "cfe-green": {
          DEFAULT: "#008E5A", // CFE Green
          foreground: "#FFFFFF", // White text for CFE Green
          "very-light": "#E6F4EF", // Very light CFE Green
        },
        "status-available": {
          DEFAULT: "#008E5A", // Verde CFE
          foreground: "#FFFFFF",
        },
        "status-lent": {
          DEFAULT: "#F59E0B", // Amarillo/Ámbar
          foreground: "hsl(20 14.3% 4.1%)", // Dark text for yellow
        },
        "status-assigned": {
          DEFAULT: "#6366F1", // Púrpura/Índigo
          foreground: "#FFFFFF",
        },
        "status-maintenance": {
          DEFAULT: "#3B82F6", // Azul
          foreground: "#FFFFFF",
        },
        "status-pending-retire": {
          DEFAULT: "#F97316", // Naranja
          foreground: "#FFFFFF",
        },
        "status-retired": {
          DEFAULT: "#EF4444", // Rojo Destructivo
          foreground: "#FFFFFF",
        },
        // New semantic colors for text emphasis
        "cfe-text-on-green": {
          DEFAULT: "#FFFFFF", // White text on CFE Green backgrounds
        },
        "cfe-black": {
          DEFAULT: "#111111",
        },
        "highlight-yellow": {
          DEFAULT: "#FFFFE0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
