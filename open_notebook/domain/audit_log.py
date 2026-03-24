"""
AuditLog domain model for compliance and security tracking.

Backed by the 'audit_log' table in SurrealDB (created in migration 005).
"""

from datetime import datetime
from typing import Any, ClassVar, Dict, List, Optional

from loguru import logger

from open_notebook.database.repository import repo_create, repo_query
from open_notebook.domain.base import ObjectModel


class AuditLogEntry(ObjectModel):
    """
    Persistent audit log record stored in SurrealDB.

    Maps to the 'audit_log' table with indexes on
    timestamp, user_id, (resource_type, resource_id), and action.
    """

    table_name: ClassVar[str] = "audit_log"
    nullable_fields: ClassVar[set[str]] = {
        "resource_id",
        "resource_name",
        "old_value",
        "new_value",
        "error_message",
        "ip_address",
        "user_agent",
        "http_status",
        "duration_ms",
        "metadata",
    }

    timestamp: Optional[datetime] = None
    user_id: Optional[str] = None
    action: str = ""
    resource_type: str = ""
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    status: str = "success"
    error_message: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    http_status: Optional[int] = None
    duration_ms: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

    @classmethod
    async def create_entry(
        cls,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        resource_name: Optional[str] = None,
        old_value: Optional[Dict] = None,
        new_value: Optional[Dict] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        http_status: Optional[int] = None,
        duration_ms: Optional[float] = None,
        metadata: Optional[Dict] = None,
    ) -> "AuditLogEntry":
        """Create and persist a new audit log entry."""
        data = {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "resource_name": resource_name,
            "old_value": old_value,
            "new_value": new_value,
            "status": status,
            "error_message": error_message,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "http_status": http_status,
            "duration_ms": duration_ms,
            "metadata": metadata or {},
        }
        # Remove None values (except nullable fields)
        clean = {
            k: v
            for k, v in data.items()
            if v is not None or k in cls.nullable_fields
        }
        result = await repo_create("audit_log", clean)
        row = result[0] if isinstance(result, list) else result
        return cls(**row)

    @classmethod
    async def query(
        cls,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """Query audit logs with filters. Returns dicts for API responses."""
        conditions: List[str] = []
        params: Dict[str, Any] = {}

        if user_id:
            conditions.append("user_id = $user_id")
            params["user_id"] = user_id
        if action:
            conditions.append("action = $action")
            params["action"] = action
        if resource_type:
            conditions.append("resource_type = $resource_type")
            params["resource_type"] = resource_type
        if resource_id:
            conditions.append("resource_id = $resource_id")
            params["resource_id"] = resource_id
        if start_date:
            conditions.append("timestamp >= $start_date")
            params["start_date"] = start_date.isoformat() + "Z"
        if end_date:
            conditions.append("timestamp <= $end_date")
            params["end_date"] = end_date.isoformat() + "Z"

        where = " AND ".join(conditions) if conditions else "true"
        q = f"SELECT * FROM audit_log WHERE {where} ORDER BY timestamp DESC LIMIT {limit}"

        results = await repo_query(q, params if params else None)
        return results

    @classmethod
    async def get_user_activity(
        cls, user_id: str, days: int = 30
    ) -> Dict[str, Any]:
        """Aggregate a user's recent activity."""
        results = await repo_query(
            "SELECT * FROM audit_log WHERE user_id = $uid AND timestamp >= time::now() - $dur ORDER BY timestamp DESC",
            {"uid": user_id, "dur": f"{days}d"},
        )

        action_counts: Dict[str, int] = {}
        successes = 0
        failures = 0
        for row in results:
            act = row.get("action", "unknown")
            action_counts[act] = action_counts.get(act, 0) + 1
            if row.get("status") == "success":
                successes += 1
            else:
                failures += 1

        total = len(results)
        return {
            "user_id": user_id,
            "period_days": days,
            "total_actions": total,
            "success_count": successes,
            "failure_count": failures,
            "success_rate": successes / total if total else 0,
            "actions_by_type": action_counts,
            "first_action": results[-1].get("timestamp") if results else None,
            "last_action": results[0].get("timestamp") if results else None,
        }
