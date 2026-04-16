"""
Train a 3-state Gaussian HMM on pollution volatility features.

Regime codes (canonicalized): 0=calm, 1=stress, 2=transition — matches
the AIDE framework's existing semantics. Reuses `aide.regimes.RegimeDetector`.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from aide.regimes import RegimeDetector
from ml.data_generator import generate


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
    ART_DIR.mkdir(parents=True, exist_ok=True)
    raw = load_or_generate()

    # Build city-wide features from cross-station averages
    city = (
        raw.groupby("timestamp")
        .agg(pm25=("pm25", "mean"))
        .sort_index()
    )
    city["pm25_ret"] = city["pm25"].pct_change()
    city["pm25_vol"] = city["pm25"].pct_change().rolling(20, min_periods=5).std()
    feats = city[["pm25_ret", "pm25_vol"]].dropna()

    det = RegimeDetector(n_components=3, random_state=42).fit(feats)
    regimes = det.predict(feats)

    counts = regimes.value_counts().sort_index().to_dict()
    print(f"regime counts: {counts}  (0=calm, 1=stress, 2=transition)")

    joblib.dump(det, ART_DIR / "hmm.pkl")
    print(f"saved → {ART_DIR/'hmm.pkl'}")


if __name__ == "__main__":
    main()
