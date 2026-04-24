"""
Vision service - calls NOVA-Researcher API for image analysis via MCP vision tool.

Flow: open-notebook backend → NOVA-Researcher API /vision/analyze → mcp_vision.py (SAM3)
"""

import os
from typing import Any, Dict, Optional

import httpx
from loguru import logger

# NOVA-Researcher API base URL
NOVA_RESEARCHER_URL = os.environ.get("NOVA_RESEARCHER_URL", "http://localhost:8002").rstrip("/")


async def run_vision_analysis(
    image_path: str,
    query: Optional[str],
    engine: str = "sam3",
) -> Dict[str, Any]:
    """
    Run image analysis by calling the NOVA-Researcher /vision/analyze endpoint.

    Args:
        query: text prompt. Required for ``sam3``; optional for ``rfdetr``
               (``None``/empty triggers prompt-free detection).
        engine: "sam3" (default) or "rfdetr"

    Returns:
        {"text": "...", "image_base64": "data:image/png;base64,..." | null}
    """
    q_log = query[:100] if query else "<none>"
    logger.info(f"Starting vision analysis via NOVA-Researcher API ({engine}): '{q_log}'")

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            with open(image_path, "rb") as f:
                files = {"image": (os.path.basename(image_path), f, "image/png")}
                data: Dict[str, str] = {"engine": engine}
                if query:
                    data["query"] = query
                resp = await client.post(
                    f"{NOVA_RESEARCHER_URL}/vision/analyze",
                    files=files,
                    data=data,
                )

        resp.raise_for_status()
        result = resp.json()

        logger.success(f"Vision analysis completed. Report length: {len(result.get('text', ''))}")

        return {
            "text": result.get("text", ""),
            "image_base64": result.get("image_base64"),
        }

    except Exception as e:
        logger.error(f"Vision analysis error: {e}")
        raise
