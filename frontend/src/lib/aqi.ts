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
    color: "#22c55e", darkColor: "#16a34a", glow: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.12)", text: "#4ade80",
    emoji: "😊", health: "Air quality is satisfactory and poses little or no health risk.",
  },
  {
    lo: 51,  hi: 100,  name: "satisfactory", label: "Satisfactory",
    color: "#a3e635", darkColor: "#65a30d", glow: "rgba(163,230,53,0.3)",
    bg: "rgba(163,230,53,0.1)", text: "#bef264",
    emoji: "🙂", health: "Air quality is acceptable. Unusually sensitive individuals may experience minor symptoms.",
  },
  {
    lo: 101, hi: 200,  name: "moderate",     label: "Moderate",
    color: "#facc15", darkColor: "#ca8a04", glow: "rgba(250,204,21,0.35)",
    bg: "rgba(250,204,21,0.1)", text: "#fde047",
    emoji: "😐", health: "Members of sensitive groups may experience health effects. General public unlikely to be affected.",
  },
  {
    lo: 201, hi: 300,  name: "poor",         label: "Poor",
    color: "#fb923c", darkColor: "#ea580c", glow: "rgba(251,146,60,0.35)",
    bg: "rgba(251,146,60,0.1)", text: "#fdba74",
    emoji: "😷", health: "Health effects are possible for everyone. Sensitive groups may experience serious effects.",
  },
  {
    lo: 301, hi: 400,  name: "very_poor",    label: "Very Poor",
    color: "#f87171", darkColor: "#dc2626", glow: "rgba(248,113,113,0.35)",
    bg: "rgba(248,113,113,0.1)", text: "#fca5a5",
    emoji: "🤢", health: "Health alert: everyone may experience serious health effects.",
  },
  {
    lo: 401, hi: 9999, name: "severe",       label: "Severe",
    color: "#c084fc", darkColor: "#9333ea", glow: "rgba(192,132,252,0.45)",
    bg: "rgba(192,132,252,0.12)", text: "#d8b4fe",
    emoji: "☠️", health: "Emergency conditions. Entire population is very likely to be affected.",
  },
];

export function bandFor(aqi: number): AQIBandDef {
  return AQI_BANDS.find((b) => aqi >= b.lo && aqi <= b.hi) ?? AQI_BANDS[AQI_BANDS.length - 1];
}
export const colorFor    = (aqi: number) => bandFor(aqi).color;
export const glowFor     = (aqi: number) => bandFor(aqi).glow;
export const intensityFor = (aqi: number) => Math.min(1, aqi / 500);
