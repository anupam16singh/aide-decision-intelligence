// Mirror of backend/app/services/aqi_bands.py — band names/thresholds only.
// Command-center theme is monochrome: severity signaled by luminance, not hue.

export type AQIBand =
  | "good"
  | "satisfactory"
  | "moderate"
  | "poor"
  | "very_poor"
  | "severe";

export interface AQIBandDef {
  lo: number;
  hi: number;
  name: AQIBand;
  label: string;
  /** Grayscale hex — 0 (black) → 255 (white). Brighter = more severe. */
  gray: string;
  /** Rough 0..1 intensity used for heatmap alpha / glow radius. */
  intensity: number;
}

export const AQI_BANDS: AQIBandDef[] = [
  { lo: 0,   hi: 50,    name: "good",         label: "Good",         gray: "#555555", intensity: 0.15 },
  { lo: 51,  hi: 100,   name: "satisfactory", label: "Satisfactory", gray: "#7a7a7a", intensity: 0.30 },
  { lo: 101, hi: 200,   name: "moderate",     label: "Moderate",     gray: "#a0a0a0", intensity: 0.50 },
  { lo: 201, hi: 300,   name: "poor",         label: "Poor",         gray: "#c5c5c5", intensity: 0.70 },
  { lo: 301, hi: 400,   name: "very_poor",    label: "Very Poor",    gray: "#eaeaea", intensity: 0.87 },
  { lo: 401, hi: 10000, name: "severe",       label: "Severe",       gray: "#ffffff", intensity: 1.00 },
];

export function bandFor(aqi: number): AQIBandDef {
  return AQI_BANDS.find((b) => aqi >= b.lo && aqi <= b.hi) ?? AQI_BANDS[AQI_BANDS.length - 1];
}

export function colorFor(aqi: number): string {
  return bandFor(aqi).gray;
}

export function intensityFor(aqi: number): number {
  return bandFor(aqi).intensity;
}

/** Fine-grained luminance for a Cesium point — maps AQI [0..500] → gray. */
export function grayFor(aqi: number): string {
  const t = Math.max(0, Math.min(1, aqi / 500));
  const v = Math.round(60 + t * 195);
  const hh = v.toString(16).padStart(2, "0");
  return `#${hh}${hh}${hh}`;
}
