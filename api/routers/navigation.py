"""
Navigation API router — computes driving distance and time between
two Portuguese locations via NOVA-Researcher (OSRM + Nominatim).
"""

from fastapi import APIRouter, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

from open_notebook.research.navigation_service import compute_route

router = APIRouter()


class NavigationRequest(BaseModel):
    location_a: str = Field(..., min_length=1, description="Start location (Portugal)")
    location_b: str = Field(..., min_length=1, description="Destination (Portugal)")


@router.post("/navigation/route")
async def navigation_route(req: NavigationRequest):
    """
    Returns driving route info between two locations in Portugal.
    """
    try:
        return await compute_route(req.location_a.strip(), req.location_b.strip())
    except Exception as e:
        logger.error(f"Navigation failed: {e}")
        # Bubble up a useful error for the UI
        status = getattr(getattr(e, "response", None), "status_code", 500)
        detail = str(e)
        try:
            detail = e.response.json().get("detail", detail)  # type: ignore[attr-defined]
        except Exception:
            pass
        raise HTTPException(status_code=status if 400 <= status < 600 else 500, detail=detail)
