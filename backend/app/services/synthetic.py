"""
Runtime synthetic tick generator — seeded at startup, advances one 15-min
step per call. Independent of the offline training-data generator; same
physics but streamed.
"""

from __future__ import annotations

import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd

from ml.data_generator import ZONE_BIAS, compute_aqi


SIMULATED_STEP = timedelta(minutes=15)  # each tick advances the sim clock 15 min


class LiveSyntheticFeed:
    """
    Emits one `StationReading`-shaped dict per station on each `step()`.

    The simulated clock advances `SIMULATED_STEP` per tick so that feature
    windows (1h/3h/6h/12h/24h lags) accumulate quickly — 96 ticks ≈ 24 h
    of simulated history, enabling forecasts within a few minutes of real
    wall time at a 7-second tick cadence.
    """

    def __init__(self, stations_csv: Path, seed: int = 7):
        self.stations = pd.read_csv(stations_csv)
        self._rng = random.Random(seed)
        # Start simulation clock 48h before "now" so we can pre-warm
        self._t = datetime.now(tz=timezone.utc) - timedelta(hours=48)
        self._tick = 0
        # Cross-station weather held in state for temporal smoothness
        self._wind_speed = 2.8
        self._humidity = 62.0
        self._temp = 22.0
        self._wind_dir = 210.0
        self._dust_event_remaining = 0  # ticks remaining of active dust storm
        self._dust_mult = 0.0

    def step(self) -> list[dict]:
        self._tick += 1
        self._t = self._t + SIMULATED_STEP
        hour_frac = self._t.hour + self._t.minute / 60.0
        doy = self._t.timetuple().tm_yday

        # Smooth weather random walk
        self._wind_speed = max(0.2, min(10, self._wind_speed + self._rng.gauss(0, 0.15)))
        self._humidity = max(20, min(95, self._humidity + self._rng.gauss(0, 1.0)))
        self._temp = self._temp + self._rng.gauss(0, 0.2)
        self._wind_dir = (self._wind_dir + self._rng.gauss(0, 4)) % 360

        # Occasional dust event
        if self._dust_event_remaining > 0:
            self._dust_event_remaining -= 1
            self._dust_mult = 0.8 if self._dust_event_remaining > 0 else 0.0
        elif self._rng.random() < 1 / 1200:  # ~1 per 8400 ticks
            self._dust_event_remaining = self._rng.randint(15, 30)
            self._dust_mult = 0.8

        # Diurnal + winter envelope
        a = math.exp(-((hour_frac - 8) ** 2) / 5.0)
        b = math.exp(-((hour_frac - 21) ** 2) / 6.0)
        c = math.exp(-((hour_frac - 15) ** 2) / 8.0) * -0.35
        diurnal = 0.7 + 0.8 * a + 0.9 * b + c
        phase = 2 * math.pi * (doy - 15) / 365.0
        winter = 1.0 + 0.55 * math.cos(phase)

        wind_norm = (self._wind_speed - 0.2) / (10 - 0.2)
        humidity_norm = (self._humidity - 20) / (95 - 20)
        wx_mult = (1 - 0.4 * wind_norm) * (1 + 0.3 * humidity_norm)

        readings = []
        for _, s in self.stations.iterrows():
            bias = ZONE_BIAS.get(s["zone"], 1.0)
            base = s["baseline_pm25"] * bias / 1.2

            pm25 = base * diurnal * winter * wx_mult * (1 + self._dust_mult)
            pm25 += self._rng.gauss(0, base * 0.06)
            pm25 = max(5.0, min(pm25, 800.0))

            pm10 = pm25 * (1.35 + self._rng.random() * 0.3) + self._rng.gauss(0, 8)
            pm10 = max(10.0, min(pm10, 1000.0))

            traffic_amp = 1.8 if s["zone"] == "traffic" else (1.3 if s["zone"] == "commercial" else 1.0)
            rush = 1 + 0.6 * math.exp(-((hour_frac - 8) ** 2) / 2) + 0.6 * math.exp(-((hour_frac - 19) ** 2) / 2)
            traffic_index = max(0.0, min(1.0, 0.3 * rush * traffic_amp + self._rng.gauss(0, 0.04)))

            no2 = 25 + 35 * traffic_index + 0.08 * pm25 + self._rng.gauss(0, 3)
            co = 0.4 + 1.2 * traffic_index + 0.002 * pm25 + self._rng.gauss(0, 0.06)
            so2 = 6 + (10 if s["zone"] == "industrial" else 0) + self._rng.gauss(0, 1.5)
            so2 = max(1.0, min(so2, 80.0))
            o3_base = 20 + 25 * math.exp(-((hour_frac - 14) ** 2) / 8)
            o3 = max(2.0, min(o3_base - 0.15 * no2 + self._rng.gauss(0, 2), 180.0))

            aqi_series = compute_aqi(
                pd.Series([pm25]), pd.Series([pm10]),
                pd.Series([no2]), pd.Series([co]),
                pd.Series([so2]), pd.Series([o3]),
            )
            aqi = int(aqi_series.iloc[0])

            readings.append({
                "timestamp": self._t,
                "station_id": s["station_id"],
                "station_name": s["station_name"],
                "lat": float(s["lat"]),
                "lng": float(s["lng"]),
                "zone": s["zone"],
                "pm25": round(pm25, 1),
                "pm10": round(pm10, 1),
                "no2": round(no2, 1),
                "so2": round(so2, 1),
                "co": round(co, 2),
                "o3": round(o3, 1),
                "temp": round(self._temp, 1),
                "humidity": round(self._humidity, 1),
                "wind_speed": round(self._wind_speed, 2),
                "wind_dir": round(self._wind_dir, 0),
                "traffic_index": round(traffic_index, 3),
                "aqi": aqi,
                "source": "synthetic",
            })
        return readings
