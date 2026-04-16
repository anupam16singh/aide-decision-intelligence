"""
Online learning — softmax weighting over a window of past performance.

Finance: weights momentum vs mean-reversion vs volatility alphas by
rolling Sharpe.

AirTwin: weights RF vs LSTM vs naive-persistence forecasters by rolling
negative MAE (lower error → higher weight).
"""

from __future__ import annotations

from typing import Sequence

import numpy as np
import pandas as pd


class OnlineWeighting:
    """Softmax over rolling scores. Higher score → higher weight."""

    def __init__(self, window: int = 60, temperature: float = 1.0):
        self.window = window
        self.temperature = max(temperature, 1e-6)

    def weights(self, scores: pd.DataFrame) -> pd.DataFrame:
        """
        scores : DataFrame indexed by time, columns = candidate models.
                 Each cell is a performance score (higher = better).

        Returns a DataFrame of the same shape with row-normalized
        softmax weights.
        """
        rolled = scores.rolling(self.window, min_periods=1).mean()
        z = rolled.values / self.temperature
        z = z - z.max(axis=1, keepdims=True)  # numerical stability
        exp = np.exp(z)
        w = exp / exp.sum(axis=1, keepdims=True)
        return pd.DataFrame(w, index=scores.index, columns=scores.columns)

    def combine(
        self,
        predictions: pd.DataFrame,
        scores: pd.DataFrame,
    ) -> pd.Series:
        """Weighted combination of candidate predictions."""
        w = self.weights(scores).reindex_like(predictions).fillna(0.0)
        return (predictions * w).sum(axis=1)
