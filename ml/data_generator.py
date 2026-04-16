"""
Synthetic Delhi air-quality data generator.

Produces a realistic multi-station time series at 15-minute cadence with:
  - diurnal pollution cycle (rush-hour peaks + midday trough)
  - winter smog envelope (Nov–Feb amplification)
  - weather coupling (wind disperses, humidity holds particulates)
  - rush-hour traffic spikes on NO2 / CO for traffic zones
  - station-type biases (industrial > traffic > commercial > residential > greenbelt)
  - rare dust-storm and festival events

This is the primary training source. The backend can also consume the
same generator at runtime when CPCB / OpenWeather are unreachable.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
import pandas as pd


REPO_ROOT = Path(__file__).resolve().parent.parent
STATIONS_CSV = REPO_ROOT / "backend" / "app" / "data" / "delhi_stations.csv"


ZONE_BIAS = {
    "industrial": 1.35,
    "traffic": 1.20,
    "commercial": 1.00,
    "residential": 0.95,
    "greenbelt": 0.65,
}


def _diurnal(hour_frac: np.ndarray) -> np.ndarray:
    """Two-peak diurnal curve: morning rush ~8am, evening rush ~9pm."""
    a = np.exp(-((hour_frac - 8) ** 2) / 5.0)
    b = np.exp(-((hour_frac - 21) ** 2) / 6.0)
    c = np.exp(-((hour_frac - 15) ** 2) / 8.0) * -0.35  # midday trough
    return 0.7 + 0.8 * a + 0.9 * b + c


def _winter_envelope(day_of_year: np.ndarray) -> np.ndarray:
    """Nov–Feb amplification; monsoon washout Jul–Sep."""
    # sinusoidal: peak around Jan 15 (day 15), trough around Jul 15 (day 196)
    phase = 2 * math.pi * (day_of_year - 15) / 365.0
    return 1.0 + 0.55 * np.cos(phase)


def generate(
    stations: pd.DataFrame,
    start: str = "2024-11-01",
    days: int = 90,
    freq_minutes: int = 15,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    ts = pd.date_range(start=start, periods=days * 24 * (60 // freq_minutes), freq=f"{freq_minutes}min")
    n = len(ts)

    hour_frac = ts.hour + ts.minute / 60.0
    doy = ts.dayofyear
    diurnal = _diurnal(hour_frac)
    winter = _winter_envelope(doy)

    # Shared weather series (city-wide)
    temp = 18 + 6 * np.sin(2 * math.pi * hour_frac / 24) + rng.normal(0, 1.2, n)
    humidity = np.clip(55 + 15 * np.cos(2 * math.pi * (hour_frac - 4) / 24) + rng.normal(0, 4, n), 20, 95)
    wind_speed = np.clip(2.5 + 1.5 * np.sin(2 * math.pi * doy / 365) + rng.normal(0, 0.8, n), 0.2, 12)
    wind_dir = (180 + 60 * np.sin(2 * math.pi * doy / 365) + rng.normal(0, 30, n)) % 360

    # Rare dust-storm events (~1 per 30 days, adds ~1.8x for 3–6 hours)
    dust_mask = np.zeros(n)
    for _ in range(max(1, days // 30)):
        start_idx = rng.integers(0, n - 24)
        length = rng.integers(12, 25)  # 3–6 hours at 15-min
        dust_mask[start_idx:start_idx + length] += 0.8

    rows = []
    for _, station in stations.iterrows():
        bias = ZONE_BIAS.get(station["zone"], 1.0)
        base = station["baseline_pm25"] * bias / 1.2  # normalize so mean ≈ baseline

        # Station-specific noise
        noise = rng.normal(0, base * 0.08, n)

        # Weather coupling
        wind_norm = (wind_speed - 0.2) / (12 - 0.2)
        humidity_norm = (humidity - 20) / (95 - 20)
        wx_mult = (1 - 0.4 * wind_norm) * (1 + 0.3 * humidity_norm)

        pm25 = base * diurnal * winter * wx_mult * (1 + dust_mask) + noise
        pm25 = np.clip(pm25, 5, 800)

        # Other pollutants derived with station-type sensitivities
        pm10 = pm25 * rng.uniform(1.35, 1.65) + rng.normal(0, 10, n)
        pm10 = np.clip(pm10, 10, 1000)

        # NO2 and CO are traffic-driven
        traffic_amp = 1.8 if station["zone"] == "traffic" else (1.3 if station["zone"] == "commercial" else 1.0)
        rush_factor = 1 + 0.6 * np.exp(-((hour_frac - 8) ** 2) / 2) + 0.6 * np.exp(-((hour_frac - 19) ** 2) / 2)
        traffic_index = np.clip(0.3 * rush_factor * traffic_amp + rng.normal(0, 0.05, n), 0, 1)

        no2 = 25 + 35 * traffic_index + 0.08 * pm25 + rng.normal(0, 4, n)
        co = 0.4 + 1.2 * traffic_index + 0.002 * pm25 + rng.normal(0, 0.08, n)

        # SO2 and O3
        so2 = np.clip(6 + 10 * (station["zone"] == "industrial") + rng.normal(0, 2, n), 1, 80)
        # Ozone anti-correlated with NO2 (titration) and higher midday
        o3_base = 20 + 25 * np.exp(-((hour_frac - 14) ** 2) / 8)
        o3 = np.clip(o3_base - 0.15 * no2 + rng.normal(0, 3, n), 2, 180)

        rows.append(pd.DataFrame({
            "timestamp": ts,
            "station_id": station["station_id"],
            "station_name": station["station_name"],
            "lat": station["lat"],
            "lng": station["lng"],
            "zone": station["zone"],
            "pm25": np.round(pm25, 1),
            "pm10": np.round(pm10, 1),
            "no2": np.round(no2, 1),
            "so2": np.round(so2, 1),
            "co": np.round(co, 2),
            "o3": np.round(o3, 1),
            "temp": np.round(temp, 1),
            "humidity": np.round(humidity, 1),
            "wind_speed": np.round(wind_speed, 2),
            "wind_dir": np.round(wind_dir, 0),
            "traffic_index": np.round(traffic_index, 3),
        }))

    df = pd.concat(rows, ignore_index=True)
    df["aqi"] = compute_aqi(df["pm25"], df["pm10"], df["no2"], df["co"], df["so2"], df["o3"])
    return df


def compute_aqi(pm25, pm10, no2, co, so2, o3) -> pd.Series:
    """CPCB sub-index formulation (simplified). Max of pollutant sub-indices."""
    def sub_index(conc, breakpoints):
        conc = np.asarray(conc, dtype=float)
        idx = np.zeros_like(conc)
        for lo_c, hi_c, lo_i, hi_i in breakpoints:
            mask = (conc >= lo_c) & (conc <= hi_c)
            idx[mask] = ((hi_i - lo_i) / (hi_c - lo_c)) * (conc[mask] - lo_c) + lo_i
        # Above highest bucket: extrapolate
        top = breakpoints[-1]
        idx[conc > top[1]] = top[3] + (conc[conc > top[1]] - top[1]) * 0.5
        return idx

    pm25_bp = [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200),
               (91, 120, 201, 300), (121, 250, 301, 400), (251, 500, 401, 500)]
    pm10_bp = [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200),
               (251, 350, 201, 300), (351, 430, 301, 400), (431, 800, 401, 500)]
    no2_bp = [(0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200),
              (181, 280, 201, 300), (281, 400, 301, 400), (401, 800, 401, 500)]
    co_bp = [(0, 1.0, 0, 50), (1.1, 2.0, 51, 100), (2.1, 10, 101, 200),
             (10.1, 17, 201, 300), (17.1, 34, 301, 400), (34.1, 80, 401, 500)]
    so2_bp = [(0, 40, 0, 50), (41, 80, 51, 100), (81, 380, 101, 200),
              (381, 800, 201, 300), (801, 1600, 301, 400), (1601, 3200, 401, 500)]
    o3_bp = [(0, 50, 0, 50), (51, 100, 51, 100), (101, 168, 101, 200),
             (169, 208, 201, 300), (209, 748, 301, 400), (749, 1500, 401, 500)]

    subs = np.stack([
        sub_index(pm25, pm25_bp),
        sub_index(pm10, pm10_bp),
        sub_index(no2, no2_bp),
        sub_index(co, co_bp),
        sub_index(so2, so2_bp),
        sub_index(o3, o3_bp),
    ], axis=0)
    return pd.Series(np.round(subs.max(axis=0), 0), name="aqi").astype(int)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--days", type=int, default=90)
    p.add_argument("--start", type=str, default="2024-11-01")
    p.add_argument("--freq", type=int, default=15, help="minutes between samples")
    p.add_argument("--out", type=str, default=str(REPO_ROOT / "ml" / "artifacts" / "synth.parquet"))
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    stations = pd.read_csv(STATIONS_CSV)
    df = generate(stations, start=args.start, days=args.days, freq_minutes=args.freq, seed=args.seed)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        df.to_parquet(out, index=False)
    except Exception:
        out = out.with_suffix(".csv")
        df.to_csv(out, index=False)
    print(f"wrote {len(df):,} rows across {df['station_id'].nunique()} stations → {out}")
    print(df.groupby("station_id")["aqi"].describe()[["mean", "50%", "max"]].round(0))


if __name__ == "__main__":
    main()
