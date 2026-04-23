"""
Navigation service — calls NOVA-Researcher /navigation/route for
OSRM routing between two Portuguese locations.
"""

import os
from typing import Any, Dict

import httpx
from loguru import logger

NOVA_RESEARCHER_URL = os.environ.get("NOVA_RESEARCHER_URL", "http://localhost:8002").rstrip("/")


async def compute_route(location_a: str, location_b: str) -> Dict[str, Any]:
    """
    Returns:
        {
          "start_point":    {"query", "resolved_address", "lat", "lon"},
          "end_point":      {"query", "resolved_address", "lat", "lon"},
          "distance_km":    float,
          "estimated_time": "Xh00",
          "route_preference": "...",
          "source": "osrm",
        }
    """
    logger.info(f"Navigation: '{location_a}' -> '{location_b}'")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{NOVA_RESEARCHER_URL}/navigation/route",
            json={"location_a": location_a, "location_b": location_b},
        )
        resp.raise_for_status()
        return resp.json()
