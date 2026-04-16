"""Feature engineering for AQI forecasting — lags, rolling stats, diurnal encoding."""

from __future__ import annotations

import numpy as np
import pandas as pd


LAG_HOURS = [1, 3, 6, 12, 24]
ROLL_WINDOWS = [3, 6, 24]  # hours


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Expects one station's time-series sorted by timestamp at fixed cadence.
    Emits per-row features + targets for 1h / 3h / 6h horizons.
    """
    df = df.sort_values("timestamp").copy()
    df["hour"] = df["timestamp"].dt.hour
    df["dow"] = df["timestamp"].dt.dayofweek
    df["sin_h"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["cos_h"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["sin_d"] = np.sin(2 * np.pi * df["dow"] / 7)
    df["cos_d"] = np.cos(2 * np.pi * df["dow"] / 7)

    step_per_hour = max(int(round(3600 / (df["timestamp"].diff().dt.total_seconds().median()))), 1)

    for h in LAG_HOURS:
        df[f"pm25_lag{h}"] = df["pm25"].shift(h * step_per_hour)
    for w in ROLL_WINDOWS:
        df[f"pm25_roll{w}"] = df["pm25"].rolling(w * step_per_hour, min_periods=1).mean()
        df[f"pm25_std{w}"] = df["pm25"].rolling(w * step_per_hour, min_periods=1).std()

    # Targets
    for h in (1, 3, 6):
        df[f"target_pm25_{h}h"] = df["pm25"].shift(-h * step_per_hour)

    return df


FEATURE_COLS = [
    "pm25", "pm10", "no2", "so2", "co", "o3",
    "temp", "humidity", "wind_speed", "wind_dir", "traffic_index",
    "sin_h", "cos_h", "sin_d", "cos_d",
    *[f"pm25_lag{h}" for h in LAG_HOURS],
    *[f"pm25_roll{w}" for w in ROLL_WINDOWS],
    *[f"pm25_std{w}" for w in ROLL_WINDOWS],
]

TARGET_COLS = ["target_pm25_1h", "target_pm25_3h", "target_pm25_6h"]
