from datetime import datetime
from typing import Optional

from bson import ObjectId

from app.database.connection import get_database
from app.database.models import UserInDB


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    db = get_database()
    doc = await db["users"].find_one({"email": email.lower()})
    return UserInDB(**doc) if doc else None


async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        return None
    doc = await db["users"].find_one({"_id": oid})
    return UserInDB(**doc) if doc else None


async def get_user_by_google_id(google_id: str) -> Optional[UserInDB]:
    db = get_database()
    doc = await db["users"].find_one({"google_id": google_id})
    return UserInDB(**doc) if doc else None


async def create_user(email: str, name: str, password_hash: str, google_id: Optional[str] = None) -> UserInDB:
    db = get_database()
    now = datetime.utcnow()
    doc = {
        "email": email.lower(),
        "name": name,
        "password_hash": password_hash,
        "google_id": google_id,
        "created_at": now,
        "updated_at": now,
    }
    res = await db["users"].insert_one(doc)
    created = await db["users"].find_one({"_id": res.inserted_id})
    return UserInDB(**created)


async def update_user_google_link(user_id: ObjectId, google_id: str) -> None:
    db = get_database()
    await db["users"].update_one(
        {"_id": user_id},
        {"$set": {"google_id": google_id, "updated_at": datetime.utcnow()}},
    )


