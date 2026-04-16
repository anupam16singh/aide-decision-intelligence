"""Alpha signals — abstract base and concrete implementations."""

from __future__ import annotations

import pandas as pd

from .engine import DecisionContext


class AlphaSignal:
    """Abstract alpha signal — subclass and implement `generate`."""

    def generate(self, context: DecisionContext):
        raise NotImplementedError


class OnlineLearningAlpha(AlphaSignal):
    """
    Pass-through: assumes `context.alpha_returns` has already been
    combined by the online-learning weighting step upstream.
    """

    def generate(self, context: DecisionContext):
        return context.alpha_returns


class RegimeConditionedAlpha(AlphaSignal):
    """
    Switches alpha behavior based on detected regime.

    Original (finance): momentum in calm, mean-reversion in stress,
    blended in transition.

    AirTwin (applied): could route between a fast short-horizon forecaster
    in calm regimes vs a conservative median-reverter in stress regimes.
    """

    def __init__(self, fast_alpha: pd.Series, slow_alpha: pd.Series):
        self.fast = fast_alpha
        self.slow = slow_alpha

    def generate(self, context: DecisionContext):
        regimes = context.regimes
        alpha = pd.Series(index=regimes.index, dtype=float)

        for date in alpha.index:
            regime = regimes.loc[date]
            if regime == 0:          # calm
                alpha.loc[date] = self.fast.loc[date]
            elif regime == 1:        # stress
                alpha.loc[date] = self.slow.loc[date]
            else:                    # transition
                alpha.loc[date] = (
                    0.5 * self.fast.loc[date]
                    + 0.5 * self.slow.loc[date]
                )

        return alpha.dropna()
