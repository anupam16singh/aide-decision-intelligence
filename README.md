# AIDE Decision Intelligence — Finance & AirTwin India

This repository is organized into **two parts**, built on a single
domain-agnostic decision-intelligence framework:

- **Part 1 — AIDE Framework** (original research prototype): a regime-aware
  portfolio allocation system. The architecture is modular and intentionally
  decoupled from finance-specific logic.
- **Part 2 — AirTwin India** (applied system): India's first AI Digital
  Twin for urban air quality. The *same* AIDE framework re-used for Delhi's
  real-time pollution monitoring, hybrid-AI forecasting, and autonomous
  recommendation generation.

The original AIDE notebook is preserved verbatim. The AirTwin system is a
fresh extraction (`aide/`) plus a full-stack application around it.

> **Quick demo**: see [`docs/DEMO.md`](docs/DEMO.md) — `git clone` to live
> 3D war-room dashboard in five commands.

---

# Part 2 — AirTwin India 🇮🇳

**An AI-Powered Digital Twin for Urban Environmental Intelligence and
Autonomous Pollution Control.**

AirTwin India is not just an AQI dashboard. It is a **layered
decision-intelligence system** that ingests real-time pollution, weather and
traffic signals, runs a hybrid AI forecaster (Random Forest + LSTM + HMM
regimes), and emits context-aware recommendations — all surfaced on a 3D
CesiumJS twin of Delhi streaming over WebSocket.

## The Five-Layer System

```
1. DATA LAYER          CPCB + OpenWeather + Traffic + Synthetic fallback
2. INTELLIGENCE LAYER  Random Forest + LSTM ensemble + GaussianHMM regimes
3. DECISION LAYER      AIDE engine + rule-based recommender + regime urgency
4. STREAMING LAYER     FastAPI + WebSocket tick loop (7 s cadence)
5. VISUALIZATION       CesiumJS 3D globe + React war-room dashboard
```

Full diagram and tick lifecycle: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Why it's a Digital Twin, not a Dashboard

- **Live 3D state**: 12 Delhi CPCB stations rendered as AQI-colored point
  entities on a Cesium world-terrain globe with OSM buildings. AQI > 300
  hotspots pulse.
- **Predictive simulation**: every tick updates 1h/3h/6h forecasts with 95%
  confidence bands. The twin isn't just *showing* now — it's showing what's
  coming.
- **Regime awareness**: the same HMM that classified market regimes for
  AIDE-finance classifies city-wide pollution regimes here — calm / stress /
  transition — and scales recommendation urgency accordingly.
- **Autonomous decisions**: five rule families (traffic rerouting, health
  advisories, industrial inspection, school activities, pre-positioning
  monitoring) fire through `RegimeAwarePolicy`; urgency is 1.0× in calm,
  1.8× in stress.

## Hybrid AI

| Model | Role | Output |
|---|---|---|
| `RandomForestRegressor` (multi-output) | Baseline multi-horizon forecast | Mean + tree-variance confidence band |
| `Keras LSTM(64) → Dense(3)` | Time-series refinement on 24 h windows | Mean for 1 h / 3 h / 6 h |
| `hmmlearn.GaussianHMM` (3-state) | City-wide regime | `calm` / `stress` / `transition` |
| Rule engine × `RegimeAwarePolicy` | Decision layer | Ranked recommendations with urgency 0–10 |

Ensemble weighting: `0.6 × RF + 0.4 × LSTM`; LSTM is optional — the system
runs RF-only if TensorFlow is unavailable.

## Quick Start

```bash
pip install -r requirements.txt
PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000   # terminal 1
cd frontend && npm install && npm run dev                         # terminal 2
# open http://localhost:5173
```

Trained ML artifacts ship in `ml/artifacts/` (≈ 3 MB total). Re-training is
optional — see [`docs/DEMO.md`](docs/DEMO.md).

## Framework Reuse — Finance → Air Quality

The AIDE abstractions are re-used verbatim. See
[`docs/AIDE_REUSE.md`](docs/AIDE_REUSE.md) for the full mapping table.

| AIDE (finance) | AirTwin (air quality) |
|---|---|
| `DecisionContext.returns` | Recent PM2.5 deltas |
| `MarketState.risk_multiplier` | Pollution urgency multiplier |
| `GaussianHMM` regime detector | Same model, re-trained on pm25 volatility |
| `RegimeAwarePolicy` | Rule urgency scaler by regime |
| `RiskManager` drawdown cap | AQI hazard ceiling |
| `OnlineLearningAlpha` softmax | Ensemble weighting of forecasters |

## Repository Layout (Part 2)

```
aide/                 — framework extraction (domain-agnostic)
backend/app/          — FastAPI app: routers, services, schemas, scheduler
  ├─ services/        — ingest, synthetic, inference, recommender, ws_manager
  ├─ routers/         — stations, forecast, recommendations, ws
  └─ data/            — delhi_stations.csv (12 CPCB stations)
ml/                   — data_generator, train_{rf,lstm,hmm}, evaluate
  └─ artifacts/       — committed model binaries
frontend/src/         — React + Vite + Tailwind + Cesium + Recharts
docs/                 — ARCHITECTURE.md, AIDE_REUSE.md, DEMO.md
```

## Scope (v1)

**In scope** — Synthetic-first data pipeline (optional OWM overlay), 3D
Cesium twin, RF+LSTM forecasts with confidence bands, rule-based recommender
with AIDE policy, HMM regimes, WebSocket streaming, war-room React UI.

**Out of scope** — Real IoT sensor ingest, mobile app, auth/RBAC,
persistent DB, multi-city, production CPCB scraping.

---

# Part 1 — AIDE Framework (original research prototype)

## Overview
This repository contains a **research-grade prototype** of a **regime-aware decision intelligence system** designed for robust portfolio allocation under uncertainty.

The project demonstrates how **decision-making can be abstracted as a system**, separating market understanding, signal generation, decision logic, and evaluation.  
Finance is used as the **first application domain**, but the architecture is intentionally **domain-agnostic**.

This is a **prototype / MVP**, not a production trading system.

---

## Motivation
Financial markets are **non-stationary**.  
Most portfolio strategies assume static risk and fail when market regimes change.

This project addresses that problem by:
- Detecting market regimes explicitly
- Adapting alpha signals to market state
- Separating *knowledge* from *decisions*
- Evaluating performance using **fund-grade metrics**

---

## System Architecture

The system is structured into **modular layers**, inspired by real-world decision systems:

Market Data
↓
Risk & Portfolio Construction
↓
Factor Attribution (Fama–French)
↓
Regime Detection (HMM)
↓
Alpha Generation & Online Learning
↓
Decision Layer (AIDE-style)
↓
Risk Controls & Transaction Costs
↓
Final Strategy Returns
↓
Benchmark Evaluation

Each layer has a **single responsibility**, making the system transparent and extensible.

---

## Key Components

### 1. Data & Market Perception
- Historical market prices (Yahoo Finance)
- Adjusted prices for splits and dividends
- Return and volatility estimation

Purpose:
> “How does the market look right now?”

---

### 2. Portfolio Optimization
- Mean–variance optimization
- Maximum Sharpe ratio allocation
- Portfolio-level return construction

Purpose:
> “How should capital be allocated in principle?”

---

### 3. Factor Attribution (Fama–French)
- Monthly excess return alignment
- Fama–French 3-factor regression
- Separation of alpha vs beta

Purpose:
> “Is performance due to skill or market exposure?”

---

### 4. Regime Detection
- Hidden Markov Model (HMM)
- Volatility-aware regime identification
- Market states: calm, stress, transition

Purpose:
> “What type of market environment are we in?”

---

### 5. Alpha Generation
Multiple independent alpha models:
- Momentum alpha
- Mean-reversion alpha
- Volatility-adjusted alpha

These alphas are **combined and evaluated dynamically**.

Purpose:
> “What signals might provide an edge right now?”

---

### 6. Online Learning
- Rolling alpha performance evaluation
- Adaptive weighting of alpha signals
- Continuous learning without retraining

Purpose:
> “Which ideas deserve more trust right now?”

---

### 7. Regime-Conditioned Alpha Switching
- Momentum favored in calm regimes
- Mean reversion favored in stress regimes
- Blended behavior in transition regimes

Purpose:
> “Different market states require different logic.”

---

### 8. Decision Layer (AIDE-style)
A modular decision abstraction that separates:
- Signals
- Market state
- Decision policy
- Risk constraints
- Execution logic

This is the **core contribution** of the project.

Purpose:
> “Given everything we know, what decision should be made?”

---

### 9. Realism & Risk
- Transaction cost modeling
- Turnover penalties
- Risk scaling by regime
- Drawdown-aware behavior

Purpose:
> “Does the strategy survive real-world constraints?”

---

## Evaluation Framework

The system is evaluated using **institutional-grade metrics**:

### Performance Metrics
- Annual return
- Annual volatility
- Sharpe ratio
- Maximum drawdown

### Benchmark Comparison
- Strategy compared against SPY
- Safe time-series alignment
- Cumulative performance comparison

### Rolling Outperformance
- Rolling excess returns vs benchmark
- Stability of performance over time

### Information Ratio (Fund-Grade Metric)
Measures skill relative to a benchmark.

Interpretation used in this project:
- **IR > 1.0** → Exceptional skill
- **IR > 0.5** → Strong, credible edge
- **IR < 0** → No real edge

---

## Results (High-Level)
- Regime awareness improves drawdown control
- Adaptive decision logic improves robustness
- Performance improvements are **persistent**, not episodic
- Evaluation confirms skill relative to benchmark

---

## Limitations
- Backtest-based (no live execution)
- Simplified transaction cost assumptions
- Regime classification is probabilistic, not perfect
- Not optimized for latency or production trading

These limitations are acknowledged intentionally.

---

## Why This Matters
This project is **not just a trading strategy**.

It demonstrates how **decision intelligence systems** can be built for:
- finance
- policy simulation
- infrastructure planning
- resource allocation
- any domain involving uncertainty and changing regimes

The AirTwin India system in Part 2 is the first applied proof of that claim.

---

## Files
- `AIDE_Decision_System_Final.ipynb` — complete end-to-end finance prototype (unchanged)
- `aide/` — domain-agnostic framework extraction used by AirTwin

---

## Disclaimer
Part 1 is for **research and educational purposes only**.  
It is **not investment advice** and **not a production trading system**.
Part 2 is a **demo / MVP** using synthetic-first data — not a certified
air-quality advisory service.

---

## Author
Anupam Singh  
(Independent research prototype)
