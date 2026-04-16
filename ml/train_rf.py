"""
Train a multi-output Random Forest baseline for PM2.5 forecasting.

Horizons: 1h, 3h, 6h ahead. Tree-variance is stored so inference can
emit a 1.96-σ confidence band.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

from ml.data_generator import generate
from ml.features import FEATURE_COLS, TARGET_COLS, build_features


REPO_ROOT = Path(__file__).resolve().parent.parent
STATIONS_CSV = REPO_ROOT / "backend" / "app" / "data" / "delhi_stations.csv"
ART_DIR = REPO_ROOT / "ml" / "artifacts"


def load_or_generate() -> pd.DataFrame:
    parquet = ART_DIR / "synth.parquet"
    csv = ART_DIR / "synth.csv"
    if parquet.exists():
        return pd.read_parquet(parquet)
    if csv.exists():
        return pd.read_csv(csv, parse_dates=["timestamp"])
    stations = pd.read_csv(STATIONS_CSV)
    return generate(stations)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--n_estimators", type=int, default=40)
    p.add_argument("--max_depth", type=int, default=10)
    p.add_argument("--max_samples", type=float, default=0.6)
    args = p.parse_args()

    ART_DIR.mkdir(parents=True, exist_ok=True)
    raw = load_or_generate()

    feats = []
    for sid, grp in raw.groupby("station_id"):
        feats.append(build_features(grp))
    df = pd.concat(feats, ignore_index=True).dropna(subset=FEATURE_COLS + TARGET_COLS)

    X = df[FEATURE_COLS].values
    y = df[TARGET_COLS].values

    scaler = StandardScaler().fit(X)
    Xs = scaler.transform(X)

    # time-based split
    cutoff = int(len(Xs) * 0.85)
    Xtr, Xte = Xs[:cutoff], Xs[cutoff:]
    ytr, yte = y[:cutoff], y[cutoff:]

    rf = RandomForestRegressor(
        n_estimators=args.n_estimators,
        max_depth=args.max_depth,
        max_samples=args.max_samples,
        min_samples_leaf=20,
        n_jobs=-1,
        random_state=42,
    )
    rf.fit(Xtr, ytr)

    pred = rf.predict(Xte)
    for i, h in enumerate(("1h", "3h", "6h")):
        mae = mean_absolute_error(yte[:, i], pred[:, i])
        rmse = mean_squared_error(yte[:, i], pred[:, i]) ** 0.5
        print(f"RF PM2.5 {h}: MAE={mae:.1f}  RMSE={rmse:.1f}")

    joblib.dump(rf, ART_DIR / "rf.pkl", compress=("xz", 3))
    joblib.dump(scaler, ART_DIR / "scaler.pkl", compress=("xz", 3))
    joblib.dump(FEATURE_COLS, ART_DIR / "feature_cols.pkl")
    print(f"saved → {ART_DIR/'rf.pkl'} ({(ART_DIR/'rf.pkl').stat().st_size/1024:.0f} KB)")


if __name__ == "__main__":
    main()
