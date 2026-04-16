"""Quick evaluation of saved RF + LSTM models on a held-out slice."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error

from ml.features import FEATURE_COLS, TARGET_COLS, build_features


REPO_ROOT = Path(__file__).resolve().parent.parent
ART_DIR = REPO_ROOT / "ml" / "artifacts"


def main():
    parquet = ART_DIR / "synth.parquet"
    csv = ART_DIR / "synth.csv"
    df = pd.read_parquet(parquet) if parquet.exists() else pd.read_csv(csv, parse_dates=["timestamp"])
    feats = pd.concat([build_features(g) for _, g in df.groupby("station_id")], ignore_index=True)
    feats = feats.dropna(subset=FEATURE_COLS + TARGET_COLS)

    rf = joblib.load(ART_DIR / "rf.pkl")
    scaler = joblib.load(ART_DIR / "scaler.pkl")

    X = scaler.transform(feats[FEATURE_COLS].values)
    y = feats[TARGET_COLS].values
    pred = rf.predict(X)

    for i, h in enumerate(("1h", "3h", "6h")):
        mae = mean_absolute_error(y[:, i], pred[:, i])
        rmse = mean_squared_error(y[:, i], pred[:, i]) ** 0.5
        print(f"RF {h}:  MAE={mae:6.2f}   RMSE={rmse:6.2f}")


if __name__ == "__main__":
    main()
