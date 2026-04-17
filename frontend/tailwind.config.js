/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   "#0f172a",
          secondary: "#1e293b",
          card:      "#1e293b",
          elevated:  "#334155",
        },
        border: {
          DEFAULT: "#334155",
          subtle:  "#1e293b",
          bright:  "#475569",
        },
        txt: {
          primary:   "#f8fafc",
          secondary: "#cbd5e1",
          muted:     "#94a3b8",
          dim:       "#64748b",
        },
        aqi: {
          good:         "#22c55e",
          goodDark:     "#16a34a",
          goodGlow:     "rgba(34,197,94,0.35)",
          satisfactory: "#a3e635",
          satisfactoryDark: "#65a30d",
          moderate:     "#facc15",
          moderateDark: "#ca8a04",
          poor:         "#fb923c",
          poorDark:     "#ea580c",
          veryPoor:     "#f87171",
          veryPoorDark: "#dc2626",
          severe:       "#c084fc",
          severeDark:   "#9333ea",
          severeGlow:   "rgba(192,132,252,0.35)",
        },
        accent: {
          blue:   "#38bdf8",
          teal:   "#2dd4bf",
          violet: "#a78bfa",
          rose:   "#fb7185",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-card":
          "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        "gradient-hero":
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        "gradient-navbar":
          "linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      },
      boxShadow: {
        card:    "0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        glow_sm: "0 0 16px rgba(56,189,248,0.25)",
        "glow-good":     "0 0 32px rgba(34,197,94,0.35)",
        "glow-moderate": "0 0 32px rgba(250,204,21,0.35)",
        "glow-poor":     "0 0 32px rgba(251,146,60,0.35)",
        "glow-severe":   "0 0 48px rgba(192,132,252,0.45)",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        pulse2:  { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        spin_slow: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        fadeIn:     "fadeIn 0.4s ease",
        pulse2:     "pulse2 2s ease infinite",
        spin_slow:  "spin_slow 3s linear infinite",
      },
    },
  },
  plugins: [],
};
