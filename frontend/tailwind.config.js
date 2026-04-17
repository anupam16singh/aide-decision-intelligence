/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   "#f0f4f8",
          secondary: "#f8fafc",
          card:      "#ffffff",
          elevated:  "#f1f5f9",
        },
        border: {
          DEFAULT: "#e2e8f0",
          subtle:  "#f1f5f9",
          bright:  "#cbd5e1",
        },
        txt: {
          primary:   "#0f172a",
          secondary: "#334155",
          muted:     "#64748b",
          dim:       "#94a3b8",
        },
        aqi: {
          good:         "#16a34a",
          goodDark:     "#14532d",
          goodGlow:     "rgba(22,163,74,0.25)",
          satisfactory: "#65a30d",
          satisfactoryDark: "#365314",
          moderate:     "#d97706",
          moderateDark: "#92400e",
          poor:         "#ea580c",
          poorDark:     "#9a3412",
          veryPoor:     "#dc2626",
          veryPoorDark: "#991b1b",
          severe:       "#9333ea",
          severeDark:   "#581c87",
          severeGlow:   "rgba(147,51,234,0.25)",
        },
        accent: {
          blue:   "#2563eb",
          teal:   "#0d9488",
          violet: "#7c3aed",
          rose:   "#e11d48",
          indigo: "#4f46e5",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-card":   "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        "gradient-hero":   "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)",
        "gradient-navbar": "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
      },
      boxShadow: {
        card:    "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
        glow_sm: "0 0 16px rgba(79,70,229,0.2)",
        "glow-good":     "0 0 20px rgba(22,163,74,0.2)",
        "glow-moderate": "0 0 20px rgba(217,119,6,0.2)",
        "glow-poor":     "0 0 20px rgba(234,88,12,0.2)",
        "glow-severe":   "0 0 28px rgba(147,51,234,0.25)",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulse2:    { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        spin_slow: { to: { transform: "rotate(360deg)" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        fadeIn:    "fadeIn 0.4s ease",
        pulse2:    "pulse2 2s ease infinite",
        spin_slow: "spin_slow 3s linear infinite",
        slideUp:   "slideUp 0.3s ease",
      },
    },
  },
  plugins: [],
};
