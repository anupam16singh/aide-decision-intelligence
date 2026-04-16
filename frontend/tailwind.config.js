/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palantir-style monochrome command center.
        // No hues — only black → white luminance. Severity is signaled
        // through brightness, not color.
        cmd: {
          bg: "#000000",
          surface: "#050505",
          panel: "#0a0a0a",
          raised: "#141414",
          border: "#1f1f1f",
          line: "#2a2a2a",
          edge: "#3a3a3a",
          muted: "#606060",
          dim: "#8a8a8a",
          text: "#d4d4d4",
          bright: "#ffffff",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
      },
      keyframes: {
        pulse_ring: {
          "0%":   { transform: "scale(1)",   opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0"   },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.2" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.8s ease-out infinite",
        scan:       "scan 6s linear infinite",
        blink:      "blink 1.4s step-end infinite",
      },
      boxShadow: {
        inset_line: "inset 0 -1px 0 0 #1f1f1f",
      },
    },
  },
  plugins: [],
};
