export type AQIBand = "good" | "satisfactory" | "moderate" | "poor" | "very_poor" | "severe";

export interface AQIBandDef {
  lo: number; hi: number;
  name: AQIBand;
  label: string;
  color: string;
  darkColor: string;
  glow: string;
  bg: string;
  text: string;
  emoji: string;
  health: string;
}

export const AQI_BANDS: AQIBandDef[] = [
  {
    lo: 0,   hi: 50,   name: "good",         label: "Good",
    color: "#16a34a", darkColor: "#14532d", glow: "rgba(22,163,74,0.25)",
    bg: "rgba(22,163,74,0.1)", text: "#14532d",
    emoji: "😊", health: "Air quality is satisfactory and poses little or no health risk.",
  },
  {
    lo: 51,  hi: 100,  name: "satisfactory", label: "Satisfactory",
    color: "#65a30d", darkColor: "#365314", glow: "rgba(101,163,13,0.25)",
    bg: "rgba(101,163,13,0.1)", text: "#365314",
    emoji: "🙂", health: "Air quality is acceptable. Unusually sensitive individuals may experience minor symptoms.",
  },
  {
    lo: 101, hi: 200,  name: "moderate",     label: "Moderate",
    color: "#d97706", darkColor: "#92400e", glow: "rgba(217,119,6,0.25)",
    bg: "rgba(217,119,6,0.1)", text: "#92400e",
    emoji: "😐", health: "Members of sensitive groups may experience health effects. General public unlikely to be affected.",
  },
  {
    lo: 201, hi: 300,  name: "poor",         label: "Poor",
    color: "#ea580c", darkColor: "#9a3412", glow: "rgba(234,88,12,0.25)",
    bg: "rgba(234,88,12,0.1)", text: "#9a3412",
    emoji: "😷", health: "Health effects are possible for everyone. Sensitive groups may experience serious effects.",
  },
  {
    lo: 301, hi: 400,  name: "very_poor",    label: "Very Poor",
    color: "#dc2626", darkColor: "#991b1b", glow: "rgba(220,38,38,0.25)",
    bg: "rgba(220,38,38,0.1)", text: "#991b1b",
    emoji: "🤢", health: "Health alert: everyone may experience serious health effects.",
  },
  {
    lo: 401, hi: 9999, name: "severe",       label: "Severe",
    color: "#9333ea", darkColor: "#581c87", glow: "rgba(147,51,234,0.25)",
    bg: "rgba(147,51,234,0.1)", text: "#581c87",
    emoji: "☠️", health: "Emergency conditions. Entire population is very likely to be affected.",
  },
];

export function bandFor(aqi: number): AQIBandDef {
  return AQI_BANDS.find((b) => aqi >= b.lo && aqi <= b.hi) ?? AQI_BANDS[AQI_BANDS.length - 1];
}
export const colorFor     = (aqi: number) => bandFor(aqi).color;
export const glowFor      = (aqi: number) => bandFor(aqi).glow;
export const intensityFor = (aqi: number) => Math.min(1, aqi / 500);
