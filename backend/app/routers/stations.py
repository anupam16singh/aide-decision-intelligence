from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("")
async def list_stations(request: Request):
    tick = request.app.state.scheduler.latest_tick
    if tick is None:
        return []
    return [r.model_dump(mode="json") for r in tick.stations]


@router.get("/{station_id}")
async def get_station(station_id: str, request: Request):
    history = request.app.state.ingest.history(station_id)
    if not history:
        raise HTTPException(404, f"station '{station_id}' not found or no history yet")
    return {
        "station_id": station_id,
        "latest": history[-1].model_dump(mode="json"),
        "history": [h.model_dump(mode="json") for h in history[-240:]],
    }
