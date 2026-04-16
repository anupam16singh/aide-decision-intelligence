# AirTwin India — Architecture

A layered decision-intelligence system for urban air quality. Each layer has
a single responsibility; swapping one leaves the others untouched.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      1. DATA LAYER                                  │
│  CPCB (data.gov.in)    │    OpenWeather    │    Traffic stub        │
│                 ▼                                                    │
│  services/ingest.py  — merges live + synthetic fallback             │
│                 ▼                                                    │
│  services/synthetic.py — Delhi physics sim (diurnal + weather +      │
│                          traffic + winter envelope + dust events)    │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   2. INTELLIGENCE LAYER                             │
│  ml/train_rf.py     — Random Forest (multi-horizon 1h/3h/6h)        │
│  ml/train_lstm.py   — Keras LSTM(64) on 24h windows                 │
│  ml/train_hmm.py    — GaussianHMM (calm / stress / transition)      │
│                 ▼                                                    │
│  services/inference.py — loads RF + LSTM + HMM, emits ensemble      │
│                          forecast + confidence band + regime        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   3. DECISION LAYER (AIDE)                          │
│  aide/engine.py  — signal → policy → risk → execution pipeline      │
│  aide/regimes.py — MarketState / RegimeDetector wrapper             │
│  aide/policies.py — RegimeAwarePolicy, Conservative, Aggressive     │
│                 ▼                                                    │
│  services/recommender.py — rule engine × regime-aware urgency       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   4. STREAMING LAYER                                │
│  services/scheduler.py — asyncio 7s tick loop                       │
│  services/ws_manager.py — FastAPI WebSocket broadcast               │
│  routers/{stations,forecast,recommendations,ws}.py — REST + WS      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   5. VISUALIZATION LAYER                            │
│  CesiumTwin.tsx   — 3D globe, station entities, pulse hotspots      │
│  AQICard.tsx      — PM2.5/PM10/NO2/SO2/CO/O3 + trend arrows         │
│  PredictionChart  — Recharts: mean line + confidence band           │
│  RecommendationPanel / AlertsPanel / Navbar (regime pill + LIVE)    │
│  useLiveAQI hook  — WS client with exp-backoff reconnect            │
└─────────────────────────────────────────────────────────────────────┘
```

## Tick Lifecycle

Every `TICK_SECONDS` (default 7s):

1. `IngestService.tick()` — pulls synthetic base; overlays OpenWeather if
   key is set.
2. Appends reading to per-station ring buffer (`_history`, maxlen 960).
3. Every 3rd tick: `InferenceService.forecast()` runs RF + LSTM ensemble
   and caches.
4. `HMM.predict_one` over city-wide PM2.5 volatility emits current regime.
5. `recommender.generate()` produces ranked, regime-scaled suggestions.
6. `TickPayload` is built and broadcast via `ws_manager.broadcast()` to
   every connected client.

## Data Contracts

See `backend/app/models/schemas.py` for the canonical Pydantic models:

- `StationReading` — one live row per station per tick
- `Forecast` / `ForecastPoint` — ensemble mean + 95% band per horizon
- `Recommendation` — title / detail / urgency (0–10) / action_type
- `Alert` — severity-tagged notification
- `TickPayload` — the broadcast envelope

## Extension Points

| Layer | Swap… | Notes |
|-------|-------|-------|
| Data | CPCB stub → real IoT sensors | implement a new client in `services/`, register in `ingest.py` |
| Intelligence | Add Transformer forecaster | write `ml/train_*.py`, extend `InferenceService._load` |
| Decision | New policy (e.g. utilitarian) | subclass `DecisionPolicy` in `aide/policies.py` |
| Streaming | Redis pub/sub for multi-worker | replace `ws_manager.ConnectionManager` |
| Viz | Mobile app | consume same `/ws/live` endpoint |
