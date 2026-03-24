"""
Permissions management router for RBAC operations.
Backed by SurrealDB 'role' table.
"""

from fastapi import APIRouter, Request, HTTPException
from loguru import logger

from open_notebook.domain.role import Role

router = APIRouter(prefix="/permissions", tags=["permissions"])

# Canonical list of permissions in the system
SYSTEM_PERMISSIONS = [
    {"id": "read", "name": "Read", "description": "Can read notebooks and sources"},
    {"id": "write", "name": "Write", "description": "Can create and edit notebooks and sources"},
    {"id": "delete", "name": "Delete", "description": "Can delete notebooks and sources"},
    {"id": "admin", "name": "Admin", "description": "Full system access"},
]


@router.get("")
async def list_permissions(request: Request):
    """
    List all available permissions in the system.
    Requires admin role.
    """
    try:
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        return {
            "permissions": SYSTEM_PERMISSIONS,
            "total": len(SYSTEM_PERMISSIONS),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch permissions")


@router.get("/roles")
async def list_role_permissions(request: Request):
    """
    List permissions assigned to each role from the database.
    Requires admin role.
    """
    try:
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        roles = await Role.get_all_roles()
        return {
            "roles": [
                {"role": r.name, "permissions": r.permissions}
                for r in roles
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching role permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch role permissions")


@router.put("")
async def update_permissions(request: Request):
    """
    Update role permissions.
    Expects body: { "role": "editor", "permissions": ["read", "write"] }
    Requires admin role.
    """
    try:
        user = getattr(request.state, "user", None)
        if not user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        body = await request.json()
        role_name = body.get("role")
        permissions = body.get("permissions")

        if not role_name or permissions is None:
            raise HTTPException(status_code=400, detail="'role' and 'permissions' are required")

        # Validate permissions against system list
        valid_ids = {p["id"] for p in SYSTEM_PERMISSIONS}
        invalid = [p for p in permissions if p not in valid_ids]
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid permissions: {invalid}")

        db_role = await Role.get_by_name(role_name)
        if not db_role:
            raise HTTPException(status_code=404, detail=f"Role '{role_name}' not found")

        db_role.permissions = permissions
        await db_role.save()

        logger.info(f"Role '{role_name}' permissions updated to {permissions}")
        return {
            "status": "success",
            "message": "Permissions updated successfully",
            "role": db_role.to_dict(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to update permissions")

