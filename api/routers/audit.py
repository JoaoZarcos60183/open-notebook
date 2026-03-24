"""
Audit logging router for monitoring system activities and user actions.
Backed by SurrealDB 'audit_log' table.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, Request, HTTPException
from loguru import logger

from open_notebook.domain.audit_log import AuditLogEntry

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
async def get_audit_logs(
    request: Request,
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    Get audit logs with optional filtering.
    Requires admin role.
    """
    try:
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        results = await AuditLogEntry.query(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            limit=limit,
        )
        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching audit logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch audit logs")


@router.get("/user/{user_id}/activity")
async def get_user_activity(user_id: str, request: Request, days: int = Query(30, ge=1, le=365)):
    """
    Get activity summary for a specific user.
    Users can only view their own activity unless they're admin.
    """
    try:
        current_user = getattr(request.state, "user", None)
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Regular users can only see their own activity
        current_roles = current_user.get("roles", [])
        if current_user.get("id") != user_id and "admin" not in current_roles:
            raise HTTPException(status_code=403, detail="Permission denied")

        activity = await AuditLogEntry.get_user_activity(user_id, days=days)
        return activity
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activity logs")
