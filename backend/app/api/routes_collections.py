from datetime import datetime
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.api.routes_auth import get_current_user
from app.database.connection import get_database
from app.database.models import (
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
)


router = APIRouter(tags=["collections"])


def _collection_doc_to_response(doc: dict) -> CollectionResponse:
    return CollectionResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        user_id=str(doc["user_id"]),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


@router.post("/collections", response_model=CollectionResponse, status_code=201)
async def create_collection(
    collection: CollectionCreate,
    user=Depends(get_current_user),
):
    """Create a new collection for the current user."""
    db = get_database()
    collections = db["collections"]

    doc = {
        "name": collection.name,
        "user_id": ObjectId(str(user.id)),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = await collections.insert_one(doc)
    created = await collections.find_one({"_id": result.inserted_id})
    return _collection_doc_to_response(created)


@router.get("/collections", response_model=List[CollectionResponse])
async def list_collections(user=Depends(get_current_user)):
    """List all collections for the current user."""
    db = get_database()
    collections = db["collections"]

    cursor = collections.find({"user_id": ObjectId(str(user.id))}).sort(
        "updated_at", -1
    )
    items: List[CollectionResponse] = []
    async for doc in cursor:
        items.append(_collection_doc_to_response(doc))
    return items


@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    collection_update: CollectionUpdate,
    user=Depends(get_current_user),
):
    """Rename or update a collection owned by the current user."""
    db = get_database()
    collections = db["collections"]

    try:
        query = {
            "_id": ObjectId(collection_id),
            "user_id": ObjectId(str(user.id)),
        }
    except Exception:
        raise HTTPException(status_code=404, detail="Collection not found")

    update_data = {"updated_at": datetime.utcnow()}
    if collection_update.name is not None:
        update_data["name"] = collection_update.name

    result = await collections.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")

    updated = await collections.find_one(query)
    return _collection_doc_to_response(updated)


@router.delete("/collections/{collection_id}", status_code=204)
async def delete_collection(collection_id: str, user=Depends(get_current_user)):
    """
    Delete a collection owned by the current user.

    Projects in this collection are NOT deleted; their collection_id is cleared.
    """
    db = get_database()
    collections = db["collections"]
    projects = db["projects"]

    try:
        collection_obj_id = ObjectId(collection_id)
        user_obj_id = ObjectId(str(user.id))
    except Exception:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Ensure the collection belongs to this user
    delete_result = await collections.delete_one(
        {"_id": collection_obj_id, "user_id": user_obj_id}
    )
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Detach projects from this collection but keep the projects themselves
    await projects.update_many(
        {"collection_id": collection_obj_id, "user_id": user_obj_id},
        {"$set": {"collection_id": None, "updated_at": datetime.utcnow()}},
    )

    return None

