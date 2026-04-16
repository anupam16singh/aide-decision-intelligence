"""Decision policies — regime-aware, conservative, aggressive."""

from __future__ import annotations

from .engine import DecisionContext
from .regimes import MarketState


class DecisionPolicy:
    """Abstract policy — subclass and implement `decide`."""

    def decide(self, context: DecisionContext):
        raise NotImplementedError


class RegimeAwarePolicy(DecisionPolicy):
    """
    Default policy: scale signal by regime-based risk multiplier and
    subtract intervention costs.
    """

    def decide(self, context: DecisionContext):
        state = MarketState(context.regimes)
        multiplier = state.risk_multiplier()
        decision_returns = (
            context.alpha_returns * multiplier - context.transaction_costs
        )
        return decision_returns


class ConservativePolicy(DecisionPolicy):
    """
    Defensive: aggressively de-risk in stress regimes. Useful when the
    cost of being wrong is high (health advisories, capital preservation).
    """

    RISK_MAP = {0: 0.7, 1: 0.2, 2: 0.4}

    def decide(self, context: DecisionContext):
        multiplier = context.regimes.map(self.RISK_MAP).fillna(0.5)
        return context.alpha_returns * multiplier - context.transaction_costs


class AggressivePolicy(DecisionPolicy):
    """
    Opportunistic: lever up in calm regimes, maintain exposure under
    stress. Air-quality analog: bold interventions (traffic bans,
    industrial shutdowns) even when signal is noisy.
    """

    RISK_MAP = {0: 1.2, 1: 0.7, 2: 1.0}

    def decide(self, context: DecisionContext):
        multiplier = context.regimes.map(self.RISK_MAP).fillna(1.0)
        return context.alpha_returns * multiplier - context.transaction_costs
