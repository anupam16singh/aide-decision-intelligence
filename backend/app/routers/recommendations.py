from fastapi import APIRouter, Request

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("")
async def get_recommendations(request: Request, station_id: str | None = None):
    tick = request.app.state.scheduler.latest_tick
    if tick is None:
        return {"recommendations": [], "regime": "calm"}
    recs = tick.recommendations
    if station_id:
        recs = [r for r in recs if r.station_id == station_id]
    return {
        "recommendations": [r.model_dump(mode="json") for r in recs],
        "regime": tick.regime,
    }


@router.get("/regime")
async def get_regime(request: Request):
    tick = request.app.state.scheduler.latest_tick
    return {"regime": tick.regime if tick else "calm"}
