# AIDE : AirTwin India

- **AirTwin India** (applied system): India's first AI Digital
  Twin for urban air quality. The *same* AIDE framework re-used for Delhi's
  real-time pollution monitoring, hybrid-AI forecasting, and autonomous
  recommendation generation.
  
 The AirTwin system is a
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

