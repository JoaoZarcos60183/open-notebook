"""
Seed an initial admin user in SurrealDB with a bcrypt-hashed password.

Usage:
    python -m scripts.seed_admin [--email EMAIL] [--password PASSWORD]

Defaults come from ADMIN_EMAIL / ADMIN_PASSWORD env vars
(or admin@open-notebook.local / admin).
"""

import argparse
import asyncio
import os
import sys

# Ensure the repo root is on sys.path so `open_notebook` is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger

from open_notebook.domain.user import User
from open_notebook.database.repository import repo_query


async def seed_admin(email: str, password: str) -> None:
    existing = await User.get_by_email(email)
    if existing:
        logger.info(f"Admin user already exists: {email} — updating password hash")
        existing.set_password(password)
        await existing.save()
    else:
        user = User(
            email=email,
            name="Administrator",
            roles=["admin"],
            provider="local",
            is_active=True,
        )
        user.set_password(password)
        await user.save()
        logger.info(f"Admin user created: {email}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed initial admin user")
    parser.add_argument(
        "--email",
        default=os.getenv("ADMIN_EMAIL", "admin@open-notebook.local"),
        help="Admin email (default: ADMIN_EMAIL env or admin@open-notebook.local)",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("ADMIN_PASSWORD", "admin"),
        help="Admin password (default: ADMIN_PASSWORD env or 'admin')",
    )
    args = parser.parse_args()

    asyncio.run(seed_admin(args.email, args.password))


if __name__ == "__main__":
    main()
