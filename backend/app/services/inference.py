"""
Inference service — loads RF + HMM (+ optional LSTM) once at startup.

Emits forecasts with confidence bands (derived from tree variance for RF)
and a city-wide regime label consumed by the recommender.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd

from aide.regimes import RegimeDetector
from ml.features import FEATURE_COLS, build_features
from ..models.schemas import Forecast, ForecastPoint, Regime, StationReading


log = logging.getLogger(__name__)

_REGIME_NAMES: tuple[Regime, Regime, Regime] = ("calm", "stress", "transition")


class InferenceService:
    def __init__(self, artifacts_dir: Path):
        self.artifacts_dir = artifacts_dir
        self.rf = None
        self.scaler = None
        self.feature_cols: list[str] = FEATURE_COLS
        self.hmm: Optional[RegimeDetector] = None
        self.lstm = None
        self.lstm_norm = None
        self.lstm_meta = None
        self._load()

    def _load(self) -> None:
        try:
            self.rf = joblib.load(self.artifacts_dir / "rf.pkl")
            self.scaler = joblib.load(self.artifacts_dir / "scaler.pkl")
            fc = self.artifacts_dir / "feature_cols.pkl"
            if fc.exists():
                self.feature_cols = joblib.load(fc)
            log.info("loaded RF forecaster")
        except Exception as e:
            log.warning("RF model unavailable: %r", e)

        try:
            self.hmm = joblib.load(self.artifacts_dir / "hmm.pkl")
            log.info("loaded HMM regime detector")
        except Exception as e:
            log.warning("HMM unavailable: %r", e)

        lstm_path = self.artifacts_dir / "lstm.keras"
        if lstm_path.exists():
            try:
                import tensorflow as tf  # noqa: F401
                from tensorflow.keras.models import load_model

                self.lstm = load_model(lstm_path, compile=False)
                norm = np.load(self.artifacts_dir / "lstm_norm.npz", allow_pickle=True)
                self.lstm_norm = {"mu": norm["mu"], "sig": norm["sig"], "features": norm["features"]}
                meta_obj = np.load(self.artifacts_dir / "lstm_meta.npy", allow_pickle=True).item()
                self.lstm_meta = meta_obj
                log.info("loaded LSTM forecaster")
            except Exception as e:
                log.info("LSTM not loaded (optional): %r", e)

    # --- Regime ---
    def regime(self, city_pm25_series: pd.Series) -> Regime:
        if self.hmm is None or len(city_pm25_series) < 10:
            return "calm"
        returns = city_pm25_series.pct_change()
        vol = returns.rolling(20, min_periods=5).std()
        feats = pd.concat([returns, vol], axis=1).dropna()
        if feats.empty:
            return "calm"
        last = feats.iloc[-1].values
        label = self.hmm.predict_one(last)
        return _REGIME_NAMES[label]

    # --- Forecast ---
    def forecast(self, history: list[StationReading]) -> Optional[Forecast]:
        if self.rf is None or self.scaler is None or len(history) < 30:
            return None

        df = pd.DataFrame([h.model_dump() for h in history])
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        feat_df = build_features(df)
        last = feat_df.iloc[-1:]
        missing = [c for c in self.feature_cols if c not in last.columns or last[c].isna().any()]
        if missing:
            return None

        X = self.scaler.transform(last[self.feature_cols].values)
        # RF mean
        rf_mean = self.rf.predict(X)[0]  # shape (3,)
        # RF tree-variance for band
        tree_preds = np.stack([est.predict(X)[0] for est in self.rf.estimators_])
        rf_std = tree_preds.std(axis=0)

        # Optional LSTM ensemble
        model_name = "random_forest"
        final_mean = rf_mean.copy()
        if self.lstm is not None and self.lstm_norm is not None and self.lstm_meta is not None:
            try:
                lstm_pred = self._lstm_forecast(df)
                if lstm_pred is not None:
                    final_mean = 0.6 * rf_mean + 0.4 * lstm_pred
                    model_name = "rf+lstm_ensemble"
            except Exception as e:
                log.debug("LSTM inference skipped: %r", e)

        regime = self.regime(df.groupby("timestamp")["pm25"].mean())
        points = [
            ForecastPoint(
                horizon_h=h,
                mean=round(float(final_mean[i]), 1),
                lower=round(float(final_mean[i] - 1.96 * rf_std[i]), 1),
                upper=round(float(final_mean[i] + 1.96 * rf_std[i]), 1),
            )
            for i, h in enumerate((1, 3, 6))
        ]
        return Forecast(
            station_id=history[-1].station_id,
            model=model_name,
            regime=regime,
            points=points,
        )

    def _lstm_forecast(self, df_station: pd.DataFrame) -> Optional[np.ndarray]:
        meta = self.lstm_meta
        feats = list(self.lstm_norm["features"])
        step_per_hour = int(meta["step_per_hour"])
        window = int(meta["window_hours"]) * step_per_hour
        if len(df_station) < window:
            return None
        arr = df_station[feats].values[-window:].astype(np.float32)
        arr = (arr - self.lstm_norm["mu"]) / self.lstm_norm["sig"]
        pred = self.lstm.predict(arr[np.newaxis, ...], verbose=0)
        return pred[0]  # shape (3,)
