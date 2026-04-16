"""
data.gov.in CPCB slow-path client.

CPCB itself has no free REST. The government's open data portal mirrors
CPCB daily readings at a known resource id. This is a best-effort
secondary source — slow, often stale. Returns None on any error.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import aiohttp


log = logging.getLogger(__name__)

RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"
BASE = f"https://api.data.gov.in/resource/{RESOURCE_ID}"


class CPCBClient:
    def __init__(self, api_key: Optional[str], timeout_s: float = 6.0):
        self.api_key = api_key
        self.timeout = aiohttp.ClientTimeout(total=timeout_s)
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(timeout=self.timeout)
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def fetch_delhi(self) -> Optional[list[dict]]:
        """Returns a list of dicts keyed by station name (best effort)."""
        if not self.api_key:
            return None
        try:
            sess = await self._get_session()
            params = {
                "api-key": self.api_key,
                "format": "json",
                "limit": 200,
                "filters[state]": "Delhi",
            }
            async with sess.get(BASE, params=params) as r:
                if r.status != 200:
                    return None
                data = await r.json()
            return data.get("records") or []
        except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as e:
            log.debug("CPCB fetch failed: %r", e)
            return None
