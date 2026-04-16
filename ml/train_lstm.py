"""
Train an LSTM time-series forecaster for PM2.5.

Window = 24 h of past multivariate readings → predicts (1h, 3h, 6h) ahead.
CPU-trainable in ~1–2 minutes. Use --fast for ultra-quick smoke training.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from ml.data_generator import generate
from ml.features import FEATURE_COLS


REPO_ROOT = Path(__file__).resolve().parent.parent
STATIONS_CSV = REPO_ROOT / "backend" / "app" / "data" / "delhi_stations.csv"
ART_DIR = REPO_ROOT / "ml" / "artifacts"

WINDOW_HOURS = 24
HORIZONS = (1, 3, 6)

# Subset of raw (non-engineered) columns LSTM sees — keeps model input stable
LSTM_FEATURES = [
    "pm25", "pm10", "no2", "so2", "co", "o3",
    "temp", "humidity", "wind_speed", "traffic_index",
]


def load_or_generate() -> pd.DataFrame:
    parquet = ART_DIR / "synth.parquet"
    csv = ART_DIR / "synth.csv"
    if parquet.exists():
        return pd.read_parquet(parquet)
    if csv.exists():
        return pd.read_csv(csv, parse_dates=["timestamp"])
    stations = pd.read_csv(STATIONS_CSV)
    return generate(stations)


def windowize(df_station: pd.DataFrame, step_per_hour: int):
    """Build (X_windows, y_horizons) for one station."""
    df_station = df_station.sort_values("timestamp")
    arr = df_station[LSTM_FEATURES].values.astype(np.float32)
    y_pm25 = df_station["pm25"].values.astype(np.float32)
    win = WINDOW_HOURS * step_per_hour
    max_h = max(HORIZONS) * step_per_hour
    N = len(arr) - win - max_h
    if N <= 0:
        return np.empty((0, win, len(LSTM_FEATURES))), np.empty((0, len(HORIZONS)))
    X = np.stack([arr[i:i + win] for i in range(N)])
    Y = np.stack([[y_pm25[i + win + h * step_per_hour - 1] for h in HORIZONS] for i in range(N)])
    return X, Y


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--fast", action="store_true", help="5 epochs for quick smoke training")
    p.add_argument("--epochs", type=int, default=15)
    p.add_argument("--batch", type=int, default=256)
    args = p.parse_args()

    # Import tensorflow lazily so `--help` is instant
    import tensorflow as tf
    from tensorflow.keras import layers, models

    ART_DIR.mkdir(parents=True, exist_ok=True)
    raw = load_or_generate()

    # Infer step_per_hour from timestamp cadence
    cad = raw.sort_values("timestamp").groupby("station_id")["timestamp"].diff().dt.total_seconds().median()
    step_per_hour = max(int(round(3600 / cad)), 1)

    Xs, Ys = [], []
    for sid, grp in raw.groupby("station_id"):
        X, Y = windowize(grp, step_per_hour)
        Xs.append(X)
        Ys.append(Y)
    X = np.concatenate(Xs, axis=0)
    Y = np.concatenate(Ys, axis=0)

    # Normalize with training-window stats
    mu = X.reshape(-1, X.shape[-1]).mean(axis=0)
    sig = X.reshape(-1, X.shape[-1]).std(axis=0) + 1e-6
    Xn = (X - mu) / sig

    # time split
    cutoff = int(len(Xn) * 0.85)
    Xtr, Xte = Xn[:cutoff], Xn[cutoff:]
    Ytr, Yte = Y[:cutoff], Y[cutoff:]

    epochs = 5 if args.fast else args.epochs

    model = models.Sequential([
        layers.Input(shape=(Xn.shape[1], Xn.shape[2])),
        layers.LSTM(64, return_sequences=False),
        layers.Dropout(0.15),
        layers.Dense(32, activation="relu"),
        layers.Dense(len(HORIZONS)),
    ])
    model.compile(optimizer="adam", loss="mae", metrics=["mae"])
    model.fit(Xtr, Ytr, validation_data=(Xte, Yte), epochs=epochs, batch_size=args.batch, verbose=2)

    model.save(ART_DIR / "lstm.keras")
    np.savez(ART_DIR / "lstm_norm.npz", mu=mu, sig=sig, features=np.array(LSTM_FEATURES))
    np.save(ART_DIR / "lstm_meta.npy", np.array({"window_hours": WINDOW_HOURS,
                                                  "horizons": HORIZONS,
                                                  "step_per_hour": step_per_hour}, dtype=object))
    print(f"saved → {ART_DIR/'lstm.keras'}")


if __name__ == "__main__":
    main()
