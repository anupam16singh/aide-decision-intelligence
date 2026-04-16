"""
FastAPI entry point for AirTwin India.

Layer wiring at startup:
    IngestService → InferenceService → TickScheduler → WebSocket broadcast
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import forecast, health, recommendations, stations, ws
from .services.ingest import IngestService
from .services.inference import InferenceService
from .services.scheduler import TickScheduler


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    ingest = IngestService(settings)
    inference = InferenceService(settings.artifacts_dir)
    scheduler = TickScheduler(settings, ingest, inference)

    app.state.settings = settings
    app.state.ingest = ingest
    app.state.inference = inference
    app.state.scheduler = scheduler

    # Pre-populate 30h of simulated history so forecasts/regimes are warm
    await ingest.warm_up(ticks=120)
    await scheduler.start()
    try:
        yield
    finally:
        await scheduler.stop()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="AirTwin India",
        description="AI-powered Digital Twin for Urban Air Quality",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(stations.router, prefix="/api")
    app.include_router(forecast.router, prefix="/api")
    app.include_router(recommendations.router, prefix="/api")
    app.include_router(ws.router)

    @app.get("/")
    async def root():
        return {
            "service": "AirTwin India",
            "docs": "/docs",
            "ws": "/ws/live",
        }

    return app


app = create_app()
