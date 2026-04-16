"""WebSocket connection manager — broadcast to all connected clients."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket


log = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections.add(ws)
        log.info("ws connect — total=%d", len(self._connections))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(ws)
        log.info("ws disconnect — total=%d", len(self._connections))

    async def broadcast(self, payload: Any) -> None:
        async with self._lock:
            targets = list(self._connections)
        if not targets:
            return
        results = await asyncio.gather(
            *(ws.send_json(payload) for ws in targets),
            return_exceptions=True,
        )
        for ws, res in zip(targets, results):
            if isinstance(res, Exception):
                log.debug("ws send failed, dropping: %r", res)
                async with self._lock:
                    self._connections.discard(ws)

    @property
    def size(self) -> int:
        return len(self._connections)


manager = ConnectionManager()
