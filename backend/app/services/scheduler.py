"""Asyncio tick scheduler — drives the WebSocket broadcast."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from ..config import Settings
from ..models.schemas import TickPayload
from . import recommender
from .ingest import IngestService
from .inference import InferenceService
from .ws_manager import manager


log = logging.getLogger(__name__)


class TickScheduler:
    def __init__(
        self,
        settings: Settings,
        ingest: IngestService,
        inference: InferenceService,
    ):
        self.settings = settings
        self.ingest = ingest
        self.inference = inference
        self._task: asyncio.Task | None = None
        self._stop = asyncio.Event()
        self.latest_tick: TickPayload | None = None
        self.latest_forecasts: dict[str, object] = {}

    async def start(self) -> None:
        self._stop.clear()
        self._task = asyncio.create_task(self._run(), name="airtwin-tick")

    async def stop(self) -> None:
        self._stop.set()
        if self._task:
            await asyncio.wait_for(self._task, timeout=5)
        await self.ingest.close()

    async def _run(self) -> None:
        tick_n = 0
        while not self._stop.is_set():
            try:
                readings = await self.ingest.tick()

                # Forecasts only every Nth tick (inference cost)
                forecasts = {}
                if tick_n % 3 == 0:
                    for r in readings:
                        hist = self.ingest.history(r.station_id)
                        fc = self.inference.forecast(hist)
                        if fc is not None:
                            forecasts[r.station_id] = fc
                    self.latest_forecasts = forecasts
                else:
                    forecasts = self.latest_forecasts  # reuse

                # Regime from city-wide PM2.5
                import pandas as pd
                city_series = pd.Series(
                    [r.pm25 for r in readings],
                    index=[r.timestamp for r in readings],
                )
                if len(self.ingest.all_history()):
                    # Use a rolling window over history
                    hist_vals = []
                    for sid in self.ingest.all_history():
                        hist_vals.extend([h.pm25 for h in self.ingest.history(sid)])
                    if len(hist_vals) > 50:
                        city_series = pd.Series(hist_vals)
                regime = self.inference.regime(city_series)

                recs, alerts = recommender.generate(readings, forecasts, regime)

                payload = TickPayload(
                    ts=datetime.now(tz=timezone.utc),
                    regime=regime,
                    stations=readings,
                    alerts=alerts,
                    recommendations=recs,
                )
                self.latest_tick = payload

                await manager.broadcast(payload.model_dump(mode="json"))
                tick_n += 1
            except Exception as e:  # pragma: no cover — never kill the loop
                log.exception("tick failed: %r", e)

            try:
                await asyncio.wait_for(
                    self._stop.wait(), timeout=self.settings.tick_seconds,
                )
            except asyncio.TimeoutError:
                pass
