"""
Regime detection and state objects.

MarketState is kept as the class name so downstream notebook code keeps
working. AirTwin uses the same object for pollution regimes — see
docs/AIDE_REUSE.md for the semantic mapping.
"""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd


class MarketState:
    """
    Maps a regime label series to a risk multiplier.

    Regime codes (consistent across domains):
        0 → calm       → full action
        1 → stress     → reduced exposure / stronger intervention bias
        2 → transition → moderated action
    """

    DEFAULT_MULTIPLIERS = {0: 1.0, 1: 0.4, 2: 0.7}

    def __init__(self, regimes: pd.Series, multipliers: Optional[dict] = None):
        self.regimes = regimes
        self.multipliers = multipliers or self.DEFAULT_MULTIPLIERS

    def risk_multiplier(self) -> pd.Series:
        return self.regimes.map(self.multipliers).fillna(1.0)


class RegimeDetector:
    """
    Thin wrapper over `hmmlearn.GaussianHMM` with a stable regime-label
    ordering (sorted by mean of the first feature — usually volatility).

    Applicable to any univariate-or-multivariate signal that exhibits
    regime-switching behavior: equity returns/vol, PM2.5 vol, traffic
    throughput, etc.
    """

    def __init__(self, n_components: int = 3, random_state: int = 42):
        from hmmlearn.hmm import GaussianHMM

        self.model = GaussianHMM(
            n_components=n_components,
            covariance_type="full",
            n_iter=1000,
            random_state=random_state,
        )
        self._label_order: Optional[np.ndarray] = None

    def fit(self, features: pd.DataFrame) -> "RegimeDetector":
        features = features.dropna()
        self.model.fit(features.values)
        # Stable label ordering: 0=calm (low vol), 1=stress (high), 2=transition
        means = self.model.means_[:, -1]  # last column conventionally vol
        self._label_order = np.argsort(means)
        return self

    def predict(self, features: pd.DataFrame) -> pd.Series:
        features = features.dropna()
        raw = self.model.predict(features.values)
        if self._label_order is not None:
            remap = {orig: canon for canon, orig in enumerate(self._label_order)}
            raw = np.array([remap[r] for r in raw])
        return pd.Series(raw, index=features.index, name="regime")

    def predict_one(self, feature_row: np.ndarray) -> int:
        """Single-observation inference — useful for the live tick loop."""
        raw = int(self.model.predict(feature_row.reshape(1, -1))[0])
        if self._label_order is not None:
            remap = {orig: canon for canon, orig in enumerate(self._label_order)}
            raw = remap[raw]
        return raw
