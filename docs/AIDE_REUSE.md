# AIDE Framework Reuse — Finance → Air Quality

The decision-intelligence framework at the heart of this repo was first
developed in `AIDE_Decision_System_Final.ipynb` for **portfolio allocation**.
The README of that notebook explicitly notes the architecture is
*domain-agnostic*. AirTwin India is the first applied re-use of that
framework — same pipeline, different domain.

## Class-Level Mapping

| AIDE (finance)                 | AirTwin (air quality)                 | File |
|--------------------------------|---------------------------------------|------|
| `DecisionContext.returns`      | Recent PM2.5 deltas                   | `aide/engine.py` |
| `DecisionContext.alpha_returns`| Ensemble forecast deviation           | `aide/engine.py` |
| `DecisionContext.regimes`      | Pollution regimes (calm/stress/transition) | `aide/engine.py` |
| `DecisionContext.transaction_costs` | Intervention cost proxy          | `aide/engine.py` |
| `MarketState.risk_multiplier`  | Pollution state urgency multiplier    | `aide/regimes.py` |
| `GaussianHMM` regime detector  | Same model, re-trained on pm25 vol    | `aide/regimes.py` |
| `RegimeAwarePolicy`            | Rule urgency scaler by regime         | `aide/policies.py` |
| `ConservativePolicy`           | Bias toward health advisories         | `aide/policies.py` |
| `AggressivePolicy`             | Bold interventions even in noise      | `aide/policies.py` |
| `RiskManager` drawdown cap     | Fail-closed AQI hazard ceiling        | `aide/risk.py` |
| `OnlineLearningAlpha`          | Weighted ensemble of forecasters      | `aide/signals.py`, `aide/online_learning.py` |
| `AIDEEngine` orchestrator      | Decision coordinator                  | `aide/engine.py` |

## Regime Codes (identical across domains)

```
0 → calm       → baseline behavior
1 → stress     → reduced exposure / elevated intervention urgency
2 → transition → moderated posture
```

In finance, `risk_multiplier = 0.4` in stress means *de-risk*.
In air quality, the recommender inverts this to `urgency_multiplier = 1.8`
in stress (see `backend/app/services/recommender.py:REGIME_URGENCY`).
Same signal, opposite utility sign — which is exactly the kind of reuse
the abstraction enables.

## What Transferred Verbatim

- HMM regime detector (`hmmlearn.GaussianHMM`) — only the training features
  change (PM2.5 returns + rolling vol instead of portfolio returns + vol).
- `DecisionContext` — same container, new payload.
- `AIDEEngine.run()` pipeline — unchanged.
- `RiskManager` drawdown logic — interpreted as cumulative error ceiling.
- Online-learning softmax weighting — pivoted from alpha selection to
  forecaster ensembling.

## What Was Added

- `RegimeDetector` class in `aide/regimes.py` — thin wrapper over
  `GaussianHMM` with stable label ordering and a `predict_one` method for
  single-observation live inference (needed for the tick loop).
- `OnlineWeighting` class in `aide/online_learning.py` — generic rolling-
  score softmax over any set of candidate models.

## What Stayed in the Notebook

`AIDE_Decision_System_Final.ipynb` is **unchanged**. It remains the
canonical reference for the finance application: momentum / mean-reversion
alphas, Fama-French attribution, transaction costs, benchmark evaluation,
and performance metrics (Sharpe, IR, drawdown).

The `aide/` package is a *fresh extraction*, not a move — you can run the
notebook end-to-end and it will still work with the same results as before
the AirTwin pivot.
