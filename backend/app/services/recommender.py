"""
Context-aware recommendation engine.

Rules fire on the latest reading; urgency is scaled by the current
pollution regime via the AIDE `MarketState` risk multiplier, reused
domain-agnostically.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Iterable

from aide.regimes import MarketState

from ..models.schemas import Alert, Forecast, Recommendation, Regime, StationReading


# Regime → urgency scale. Inverted from the finance risk multiplier:
# in a "stress" regime we want MORE aggressive recommendations, not fewer.
REGIME_URGENCY = {"calm": 1.0, "stress": 1.8, "transition": 1.3}


def _rec(
    station_id: str,
    title: str,
    detail: str,
    base_urgency: float,
    regime: Regime,
    action_type: str,
) -> Recommendation:
    urgency = min(10.0, round(base_urgency * REGIME_URGENCY[regime], 1))
    return Recommendation(
        id=str(uuid.uuid4())[:8],
        station_id=station_id,
        title=title,
        detail=detail,
        urgency=urgency,
        action_type=action_type,  # type: ignore[arg-type]
    )


def _alert(station_id: str, severity: str, message: str) -> Alert:
    return Alert(
        id=str(uuid.uuid4())[:8],
        ts=datetime.now(tz=timezone.utc),
        severity=severity,  # type: ignore[arg-type]
        station_id=station_id,
        message=message,
    )


def generate(
    readings: Iterable[StationReading],
    forecasts: dict[str, Forecast],
    regime: Regime,
) -> tuple[list[Recommendation], list[Alert]]:
    recs: list[Recommendation] = []
    alerts: list[Alert] = []

    for r in readings:
        fc = forecasts.get(r.station_id)

        # Rule 1: traffic NO2 rerouting
        if r.no2 > 80 and r.traffic_index > 0.7:
            recs.append(_rec(
                r.station_id,
                f"Reroute heavy traffic near {r.station_name}",
                f"NO₂ at {r.no2:.0f} µg/m³ with traffic index {r.traffic_index:.2f}. "
                f"Divert non-essential traffic for 2 hours.",
                base_urgency=4.0,
                regime=regime,
                action_type="traffic",
            ))

        # Rule 2: public health advisory at severe PM2.5
        if r.pm25 > 250:
            recs.append(_rec(
                r.station_id,
                f"Public health advisory for {r.zone} zone — {r.station_name}",
                f"PM2.5 at {r.pm25:.0f} µg/m³ (severe). Issue N95 advisory; "
                f"vulnerable groups indoors.",
                base_urgency=5.0,
                regime=regime,
                action_type="health",
            ))

        # Rule 3: stagnant air + industrial dust
        if r.pm10 > 200 and r.wind_speed < 2.0:
            recs.append(_rec(
                r.station_id,
                f"Industrial dust inspection — {r.station_name}",
                f"PM10 {r.pm10:.0f} µg/m³ with wind {r.wind_speed:.1f} m/s. "
                f"Dispatch CPCB inspection to upwind industrial cluster.",
                base_urgency=3.5,
                regime=regime,
                action_type="industry",
            ))

        # Rule 4: school zones in severe AQI
        if r.aqi > 300 and r.zone in ("commercial", "residential", "traffic"):
            recs.append(_rec(
                r.station_id,
                f"Suspend outdoor school activities in {r.zone} zone",
                f"AQI {r.aqi} (severe). Notify schools in {r.station_name} catchment.",
                base_urgency=4.5,
                regime=regime,
                action_type="school",
            ))

        # Rule 5: forecast-driven pre-positioning
        if fc and fc.points and fc.points[1].mean > 300:  # 3h horizon
            recs.append(_rec(
                r.station_id,
                f"Pre-position alert assets near {r.station_name}",
                f"3-hour forecast PM2.5 {fc.points[1].mean:.0f} µg/m³ "
                f"(±{(fc.points[1].upper - fc.points[1].mean):.0f}). "
                f"Pre-stage mobile monitoring + SMS alert system.",
                base_urgency=3.0,
                regime=regime,
                action_type="advisory",
            ))

        # Alerts
        if r.aqi > 400:
            alerts.append(_alert(r.station_id, "critical",
                                 f"{r.station_name}: AQI {r.aqi} (severe)"))
        elif r.aqi > 300:
            alerts.append(_alert(r.station_id, "warning",
                                 f"{r.station_name}: AQI {r.aqi} (very poor)"))

    # Rank by urgency and cap total recs for UI sanity
    recs.sort(key=lambda x: x.urgency, reverse=True)
    return recs[:12], alerts[:20]


def regime_from_state(regime_label: Regime) -> MarketState:
    """For diagnostic use — expose the AIDE MarketState wrapper."""
    import pandas as pd
    return MarketState(pd.Series({regime_label: {"calm": 0, "stress": 1, "transition": 2}[regime_label]}))
