from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/{station_id}")
async def get_forecast(station_id: str, request: Request):
    history = request.app.state.ingest.history(station_id)
    if not history:
        raise HTTPException(404, f"no data yet for '{station_id}'")
    fc = request.app.state.inference.forecast(history)
    if fc is None:
        # Fall back to the scheduler's cached forecast if available
        cached = request.app.state.scheduler.latest_forecasts.get(station_id)
        if cached is not None:
            return cached.model_dump(mode="json")
        raise HTTPException(503, "forecaster not warm yet")
    return fc.model_dump(mode="json")
