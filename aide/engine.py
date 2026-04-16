"""AIDE core engine and decision context (extracted from notebook cells 44, 52)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class DecisionContext:
    """
    Carries everything a decision needs: signals, regimes, costs, and any
    extra domain-specific payload.

    Finance (original):
        returns           = portfolio returns
        alpha_returns     = combined alpha signal returns
        regimes           = pd.Series of regime labels (0/1/2)
        transaction_costs = cost series

    AirTwin (applied):
        returns           = recent PM2.5 deltas
        alpha_returns     = ensemble forecast deviation vs persistence
        regimes           = pollution regimes (0=calm, 1=stress, 2=transition)
        transaction_costs = intervention cost proxy (0 if none)
        extra             = {"reading": StationReading, "forecast": Forecast, ...}
    """

    returns: Any
    alpha_returns: Any
    regimes: Any
    transaction_costs: Any
    extra: dict = field(default_factory=dict)


class AIDEEngine:
    """
    Orchestrator: signal → policy → risk → execution.

    Pipeline semantics are identical across domains — only the objects
    that implement each stage change.
    """

    def __init__(self, signal, policy, risk, execution):
        self.signal = signal
        self.policy = policy
        self.risk = risk
        self.execution = execution

    def run(self, context: DecisionContext):
        signal_returns = self.signal.generate(context)
        decision_returns = self.policy.decide(context)
        risk_adjusted = self.risk.apply(decision_returns)
        final_returns = self.execution.execute(risk_adjusted)
        return final_returns
