"""CPCB AQI band mapping — single source of truth shared by backend and
mirrored by the frontend in `frontend/src/lib/aqi.ts`."""

from __future__ import annotations

from typing import Literal

AQIBand = Literal["good", "satisfactory", "moderate", "poor", "very_poor", "severe"]


BANDS = [
    (0, 50, "good", "#10b981"),
    (51, 100, "satisfactory", "#84cc16"),
    (101, 200, "moderate", "#facc15"),
    (201, 300, "poor", "#f97316"),
    (301, 400, "very_poor", "#ef4444"),
    (401, 10_000, "severe", "#7f1d1d"),
]


def band(aqi: int) -> AQIBand:
    for lo, hi, name, _ in BANDS:
        if lo <= aqi <= hi:
            return name  # type: ignore[return-value]
    return "severe"


def color(aqi: int) -> str:
    for lo, hi, _, hex_ in BANDS:
        if lo <= aqi <= hi:
            return hex_
    return BANDS[-1][3]
