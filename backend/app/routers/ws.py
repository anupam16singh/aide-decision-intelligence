from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect

from ..services.ws_manager import manager

router = APIRouter(tags=["ws"])


@router.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await manager.connect(ws)
    # Send latest snapshot immediately so new clients don't wait a full tick
    app = ws.app
    scheduler = getattr(app.state, "scheduler", None)
    if scheduler and scheduler.latest_tick is not None:
        try:
            await ws.send_json(scheduler.latest_tick.model_dump(mode="json"))
        except Exception:
            pass
    try:
        while True:
            # We don't expect client messages; keep the connection alive.
            await ws.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(ws)
    except Exception:
        await manager.disconnect(ws)
