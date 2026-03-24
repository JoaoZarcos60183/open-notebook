"""
Role domain model for RBAC permission management.

Backed by the 'role' table in SurrealDB (created in migration 005).
"""

from typing import ClassVar, List, Optional

from loguru import logger

from open_notebook.database.repository import repo_query
from open_notebook.domain.base import ObjectModel


class Role(ObjectModel):
    """
    Role record storing a named set of permissions.

    Maps to the 'role' SurrealDB table.  Default roles (admin, editor,
    viewer) are seeded by migration 005.
    """

    table_name: ClassVar[str] = "role"
    nullable_fields: ClassVar[set[str]] = {"description"}

    name: str
    description: Optional[str] = None
    permissions: List[str] = []
    is_default: bool = False

    @classmethod
    async def get_by_name(cls, name: str) -> Optional["Role"]:
        """Find a role by name."""
        results = await repo_query(
            "SELECT * FROM role WHERE name = $name LIMIT 1",
            {"name": name},
        )
        if results:
            return cls(**results[0])
        return None

    @classmethod
    async def get_all_roles(cls) -> List["Role"]:
        """Get every role ordered by name."""
        results = await repo_query(
            "SELECT * FROM role ORDER BY name ASC"
        )
        roles = []
        for row in results:
            try:
                roles.append(cls(**row))
            except Exception as e:
                logger.warning(f"Skipping invalid role row: {e}")
        return roles

    def to_dict(self) -> dict:
        """API-safe representation."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "permissions": self.permissions,
            "is_default": self.is_default,
            "created": self.created.isoformat() if self.created else None,
            "updated": self.updated.isoformat() if self.updated else None,
        }
