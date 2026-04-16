import type { AQIBand } from "./aqi";

export type Regime = "calm" | "stress" | "transition";

export interface StationReading {
  timestamp: string;
  station_id: string;
  station_name: string;
  lat: number;
  lng: number;
  zone: string;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temp: number;
  humidity: number;
  wind_speed: number;
  wind_dir: number;
  traffic_index: number;
  aqi: number;
  aqi_band: AQIBand;
  source: "cpcb" | "openweather" | "synthetic";
  trend_pm25?: number | null;
}

export interface ForecastPoint {
  horizon_h: number;
  mean: number;
  lower: number;
  upper: number;
}

export interface Forecast {
  station_id: string;
  model: string;
  regime: Regime;
  points: ForecastPoint[];
}

export interface Alert {
  id: string;
  ts: string;
  severity: "info" | "warning" | "critical";
  station_id?: string | null;
  message: string;
}

export interface Recommendation {
  id: string;
  station_id?: string | null;
  title: string;
  detail: string;
  urgency: number;
  action_type: "traffic" | "industry" | "health" | "school" | "advisory";
}

export interface TickPayload {
  type: "tick";
  ts: string;
  regime: Regime;
  stations: StationReading[];
  alerts: Alert[];
  recommendations: Recommendation[];
}
