/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cmd: {
          bg: "#070b14",
          panel: "#0d1422",
          border: "#1b2540",
          accent: "#00d9ff",
          text: "#e6edf7",
          muted: "#8898b8",
        },
        aqi: {
          good: "#10b981",
          satisfactory: "#84cc16",
          moderate: "#facc15",
          poor: "#f97316",
          veryPoor: "#ef4444",
          severe: "#7f1d1d",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        pulse_ring: {
          "0%": { transform: "scale(1)", opacity: "0.7" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.5s ease-out infinite",
      },
    },
  },
  plugins: [],
};
