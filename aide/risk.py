"""Risk manager — drawdown / hazard ceiling enforcement."""

from __future__ import annotations

import pandas as pd


class RiskManager:
    """
    Hard cap on cumulative downside.

    Finance: zero out returns once drawdown breaches `max_drawdown`.
    AirTwin: can be interpreted as zeroing out forecast-driven actions
    once cumulative AQI error breaches a safety ceiling (fail closed).
    """

    def apply(self, returns: pd.Series, max_drawdown: float = 0.2) -> pd.Series:
        cumulative = (1 + returns).cumprod()
        drawdown = (cumulative - cumulative.cummax()) / cumulative.cummax()
        returns = returns.copy()
        returns[drawdown < -max_drawdown] = 0.0
        return returns
