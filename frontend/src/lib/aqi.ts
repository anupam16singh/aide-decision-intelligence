// Mirror of backend/app/services/aqi_bands.py — keep in sync.

export type AQIBand =
  | "good"
  | "satisfactory"
  | "moderate"
  | "poor"
  | "very_poor"
  | "severe";

export const AQI_BANDS: { lo: number; hi: number; name: AQIBand; color: string; label: string }[] = [
  { lo: 0,   hi: 50,    name: "good",         color: "#10b981", label: "Good" },
  { lo: 51,  hi: 100,   name: "satisfactory", color: "#84cc16", label: "Satisfactory" },
  { lo: 101, hi: 200,   name: "moderate",     color: "#facc15", label: "Moderate" },
  { lo: 201, hi: 300,   name: "poor",         color: "#f97316", label: "Poor" },
  { lo: 301, hi: 400,   name: "very_poor",    color: "#ef4444", label: "Very Poor" },
  { lo: 401, hi: 10000, name: "severe",       color: "#7f1d1d", label: "Severe" },
];

export function bandFor(aqi: number) {
  return AQI_BANDS.find((b) => aqi >= b.lo && aqi <= b.hi) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

export function colorFor(aqi: number) {
  return bandFor(aqi).color;
}
