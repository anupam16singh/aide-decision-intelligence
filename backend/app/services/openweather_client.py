"""
OpenWeatherMap air-pollution + weather client.

Best-effort: any error returns None and the caller falls back to synthetic.
Free-tier endpoints:
  /data/2.5/air_pollution
  /data/2.5/weather
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import aiohttp


log = logging.getLogger(__name__)


class OpenWeatherClient:
    BASE = "https://api.openweathermap.org/data/2.5"

    def __init__(self, api_key: Optional[str], timeout_s: float = 4.0):
        self.api_key = api_key
        self.timeout = aiohttp.ClientTimeout(total=timeout_s)
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=self.timeout)
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def fetch_air(self, lat: float, lng: float) -> Optional[dict]:
        if not self.api_key:
            return None
        try:
            sess = await self._get_session()
            async with sess.get(
                f"{self.BASE}/air_pollution",
                params={"lat": lat, "lon": lng, "appid": self.api_key},
            ) as r:
                if r.status != 200:
                    return None
                data = await r.json()
            comp = data["list"][0]["components"]
            return {
                "pm25": comp.get("pm2_5", 0.0),
                "pm10": comp.get("pm10", 0.0),
                "no2": comp.get("no2", 0.0),
                "so2": comp.get("so2", 0.0),
                "co": comp.get("co", 0.0) / 1000.0,  # µg/m³ → mg/m³
                "o3": comp.get("o3", 0.0),
            }
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError, IndexError) as e:
            log.debug("OWM air fetch failed: %r", e)
            return None

    async def fetch_weather(self, lat: float, lng: float) -> Optional[dict]:
        if not self.api_key:
            return None
        try:
            sess = await self._get_session()
            async with sess.get(
                f"{self.BASE}/weather",
                params={"lat": lat, "lon": lng, "appid": self.api_key, "units": "metric"},
            ) as r:
                if r.status != 200:
                    return None
                data = await r.json()
            return {
                "temp": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "wind_speed": data["wind"].get("speed", 0.0),
                "wind_dir": data["wind"].get("deg", 0.0),
            }
        except (aiohttp.ClientError, asyncio.TimeoutError, KeyError) as e:
            log.debug("OWM weather fetch failed: %r", e)
            return None
