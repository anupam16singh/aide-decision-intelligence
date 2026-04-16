"""Pydantic schemas shared across routers and services."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


Regime = Literal["calm", "stress", "transition"]
AQIBand = Literal["good", "satisfactory", "moderate", "poor", "very_poor", "severe"]


class Station(BaseModel):
    station_id: str
    station_name: str
    lat: float
    lng: float
    zone: str
    cpcb_code: Optional[str] = None


class StationReading(BaseModel):
    timestamp: datetime
    station_id: str
    station_name: str
    lat: float
    lng: float
    zone: str

    pm25: float
    pm10: float
    no2: float
    so2: float
    co: float
    o3: float

    temp: float
    humidity: float
    wind_speed: float
    wind_dir: float
    traffic_index: float

    aqi: int
    aqi_band: AQIBand
    source: Literal["cpcb", "openweather", "synthetic"] = "synthetic"

    # Trend (hourly Δ%) — filled by ingest service
    trend_pm25: Optional[float] = None


class ForecastPoint(BaseModel):
    horizon_h: int
    mean: float
    lower: float
    upper: float


class Forecast(BaseModel):
    station_id: str
    model: str
    regime: Regime
    points: list[ForecastPoint]


class Alert(BaseModel):
    id: str
    ts: datetime
    severity: Literal["info", "warning", "critical"]
    station_id: Optional[str] = None
    message: str


class Recommendation(BaseModel):
    id: str
    station_id: Optional[str] = None
    title: str
    detail: str
    urgency: float = Field(ge=0, le=10)
    action_type: Literal["traffic", "industry", "health", "school", "advisory"]


class TickPayload(BaseModel):
    type: Literal["tick"] = "tick"
    ts: datetime
    regime: Regime
    stations: list[StationReading]
    alerts: list[Alert]
    recommendations: list[Recommendation]
