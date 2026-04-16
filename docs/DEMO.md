# AirTwin India — Demo Guide

This is the minimum path from `git clone` to a live war-room dashboard.

## Prerequisites

- Python 3.11+
- Node.js 18+
- ~5 GB free disk (TensorFlow-cpu wheels)
- Optional: a Cesium Ion token (free tier) for 3D terrain + OSM buildings

## 1. Install Python dependencies

```bash
cd aide-decision-intelligence
pip install -r requirements.txt
```

`tensorflow-cpu` is the heaviest dep (~550 MB). LSTM inference is
**optional** — the system still produces RF-only ensembles if TF is absent.

## 2. (Optional) Re-train from scratch

Trained artifacts for the demo are committed in `ml/artifacts/`:
`rf.pkl`, `lstm.keras`, `hmm.pkl`, `scaler.pkl`, `lstm_norm.npz`,
`lstm_meta.npy`, `feature_cols.pkl`. Skip straight to step 3 unless you
want to regenerate.

```bash
python -m ml.data_generator --days 90             # synth.parquet (git-ignored)
python -m ml.train_hmm
python -m ml.train_rf
python -m ml.train_lstm --fast                    # 5 epochs (≈ 3 min CPU)
python -m ml.evaluate                             # held-out MAE / RMSE
```

## 3. Configure environment (optional)

```bash
cp .env.example .env
# Fill CESIUM_ION_TOKEN for 3D terrain; leave blank for plain globe.
# Fill OPENWEATHER_API_KEY to overlay live data on synthetic base.
```

Without any `.env` file, the demo runs entirely on synthetic data — by
design.

## 4. Start the backend

```bash
PYTHONPATH=. uvicorn backend.app.main:app --reload --port 8000
```

Startup takes ~12 s (TF load + 30 h simulated pre-warm). You should see:

```
INFO  loaded RF forecaster
INFO  loaded HMM regime detector
INFO  loaded LSTM forecaster
INFO  Application startup complete.
INFO  Uvicorn running on http://127.0.0.1:8000
```

### Smoke-test the API

```bash
curl -s localhost:8000/api/health
curl -s localhost:8000/api/stations | jq '.[0]'
curl -s localhost:8000/api/forecast/anand_vihar | jq
curl -s localhost:8000/api/recommendations | jq '.regime, (.recommendations | length)'
```

WebSocket tick (Python one-liner):

```python
import asyncio, aiohttp, json
async def go():
    async with aiohttp.ClientSession() as s, s.ws_connect('ws://localhost:8000/ws/live') as ws:
        async for m in ws:
            print(json.loads(m.data)['regime'], len(json.loads(m.data)['stations'])); break
asyncio.run(go())
```

## 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

What you should see within ~15 seconds:

- **Delhi 3D globe** with 12 color-coded station markers
- **Top-right regime pill** flipping between calm / stress / transition
- **AQI card** for the highest-AQI station (PM2.5/PM10/NO2/SO2/CO/O3 +
  trend arrows)
- **Prediction chart** with mean line + 95% confidence band for 1h/3h/6h
- **Recommendation panel** with urgency-ranked cards
- **Live alerts** scrolling in as AQI crosses thresholds
- **LIVE** chip (top-right) pulsing green while the WS is connected

## 6. Demo Script (for judges)

1. "This is AirTwin India — a real-time AI Digital Twin for Delhi's air
   quality. We built it on our own AIDE decision-intelligence framework,
   originally developed for portfolio allocation — both share the same
   regime-aware pipeline."
2. Point at the Cesium globe. "12 CPCB stations, colored by live AQI. Red
   pulsing markers are AQI > 300 — severe."
3. Click **Anand Vihar**. "This is the most polluted station tonight. Our
   hybrid model — Random Forest + LSTM ensemble — forecasts PM2.5 at
   1-hour, 3-hour, and 6-hour horizons with 95% confidence bands."
4. Point at the regime pill. "Our HMM classifies the city into three
   regimes. Right now we're in 'transition' — pollution rising, not yet
   peak."
5. Point at the recommendation panel. "Every rule fires with an urgency
   scaled by regime. In stress regime, urgency multiplier is 1.8× —
   the same regime-aware logic our portfolio engine uses to cut risk."
6. Show the LIVE chip. "This is not polling — it's a WebSocket tick every
   7 seconds pushing fresh readings, forecasts, regimes, and
   recommendations to every connected client."
7. "Fallbacks: if CPCB or OpenWeather is down, we synthesize realistic
   Delhi-winter physics — diurnal cycle, weather coupling, rush-hour
   traffic spikes, dust events. The demo runs zero-network."

## Troubleshooting

**Backend hangs at startup for >30 s** — TensorFlow warm-up can be slow
on first run. Subsequent starts are faster.

**Cesium shows a blank globe** — you probably have no Ion token. That's
fine; set `VITE_CESIUM_ION_TOKEN` in `.env` for terrain + OSM buildings.

**Forecast endpoint returns 503** — the first few ticks after startup
haven't accumulated enough history. Wait ~15 s.

**WebSocket keeps reconnecting** — check CORS. `backend/app/config.py`
allows `http://localhost:5173` by default.

**`ml/artifacts/synth.parquet` missing** — it's git-ignored. Regenerate
with `python -m ml.data_generator`.
