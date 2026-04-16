"""
Ingest orchestrator.

Priority chain per tick:
  1. Try OpenWeather per station (if key set) — merges live pm/no2/o3/weather
  2. Try CPCB (data.gov.in) — slow, rarely alive; we only try every 60 ticks
  3. Always produce a synthetic base reading; overlay live fields on top

Maintains a bounded in-memory ring buffer per station for history + HMM.
"""

from __future__ import annotations

import logging
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Deque, Optional

from ..config import Settings
from ..models.schemas import StationReading
from .aqi_bands import band
from .cpcb_client import CPCBClient
from .openweather_client import OpenWeatherClient
from .synthetic import LiveSyntheticFeed


log = logging.getLogger(__name__)


class IngestService:
    def __init__(self, settings: Settings, history_len: int = 960):
        self.settings = settings
        self.synth = LiveSyntheticFeed(settings.stations_csv)
        self.owm = OpenWeatherClient(settings.openweather_api_key)
        self.cpcb = CPCBClient(settings.data_gov_in_api_key)
        self._history: dict[str, Deque[StationReading]] = {}
        self._history_len = history_len
        self._tick_n = 0

    async def close(self) -> None:
        await self.owm.close()
        await self.cpcb.close()

    async def warm_up(self, ticks: int = 120) -> None:
        """
        Pre-populate per-station history using the synthetic feed so that
        forecasts and regimes are available within the first live tick.
        Skips external API calls — warm-up uses pure synthetic base.
        """
        for _ in range(ticks):
            base_rows = self.synth.step()
            for row in base_rows:
                row["aqi_band"] = band(int(row["aqi"]))
                reading = StationReading(**row)
                hist = self._history.setdefault(
                    reading.station_id, deque(maxlen=self._history_len)
                )
                if len(hist) >= 60:
                    prev = hist[-60].pm25
                    if prev > 0:
                        reading.trend_pm25 = round(
                            (reading.pm25 - prev) / prev * 100, 1
                        )
                hist.append(reading)

    async def tick(self) -> list[StationReading]:
        self._tick_n += 1
        base_rows = self.synth.step()

        # Best-effort live overlays
        if self.settings.openweather_api_key:
            for row in base_rows:
                live = await self.owm.fetch_air(row["lat"], row["lng"])
                if live:
                    for k in ("pm25", "pm10", "no2", "so2", "co", "o3"):
                        if live.get(k) is not None:
                            row[k] = round(float(live[k]), 2)
                    row["source"] = "openweather"
                wx = await self.owm.fetch_weather(row["lat"], row["lng"])
                if wx:
                    row["temp"] = round(wx["temp"], 1)
                    row["humidity"] = round(wx["humidity"], 1)
                    row["wind_speed"] = round(wx["wind_speed"], 2)
                    row["wind_dir"] = round(wx["wind_dir"], 0)

        # Promote to schema, compute AQI band, derive trend
        out: list[StationReading] = []
        for row in base_rows:
            row["aqi_band"] = band(int(row["aqi"]))
            reading = StationReading(**row)
            hist = self._history.setdefault(reading.station_id, deque(maxlen=self._history_len))
            # Hourly-ish trend: compare with sample ~60 ticks ago
            if len(hist) >= 60:
                prev = hist[-60].pm25
                if prev > 0:
                    reading.trend_pm25 = round((reading.pm25 - prev) / prev * 100, 1)
            hist.append(reading)
            out.append(reading)
        return out

    def history(self, station_id: str) -> list[StationReading]:
        return list(self._history.get(station_id, []))

    def all_history(self) -> dict[str, list[StationReading]]:
        return {sid: list(dq) for sid, dq in self._history.items()}
