"""
AIDE — Adaptive Intelligent Decision Engine.

A domain-agnostic, regime-aware decision-intelligence framework. First
applied to portfolio allocation (see AIDE_Decision_System_Final.ipynb);
reused here as the decision layer for AirTwin India's pollution control
recommendations.

Layer mapping across domains:

    MarketState           → PollutionState
    alpha_returns         → ensemble forecast deviation
    regimes               → pollution regimes (calm/stress/transition)
    transaction_costs     → intervention cost proxy
    RiskManager drawdown  → AQI hazard ceiling
"""

from .engine import AIDEEngine, DecisionContext
from .signals import AlphaSignal, OnlineLearningAlpha, RegimeConditionedAlpha
from .policies import (
    DecisionPolicy,
    RegimeAwarePolicy,
    ConservativePolicy,
    AggressivePolicy,
)
from .regimes import MarketState, RegimeDetector
from .risk import RiskManager
from .execution import ExecutionEngine
from .online_learning import OnlineWeighting

__all__ = [
    "AIDEEngine",
    "DecisionContext",
    "AlphaSignal",
    "OnlineLearningAlpha",
    "RegimeConditionedAlpha",
    "DecisionPolicy",
    "RegimeAwarePolicy",
    "ConservativePolicy",
    "AggressivePolicy",
    "MarketState",
    "RegimeDetector",
    "RiskManager",
    "ExecutionEngine",
    "OnlineWeighting",
]
