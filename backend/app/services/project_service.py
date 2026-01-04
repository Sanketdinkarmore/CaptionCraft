from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.database.connection import get_database
from app.database.models import (
    ProjectInDB, 
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse,
    Segment,
    GlobalStyle
)

async def create_project(project_data: ProjectCreate) -> ProjectResponse:
    """Create a new project in the database"""
    db = get_database()
    projects_collection = db["projects"]
    
    # Convert user_id string to ObjectId if provided
    user_id_obj = None
    if project_data.user_id:
        try:
            user_id_obj = ObjectId(project_data.user_id)
        except Exception:
            user_id_obj = None
    
    # Create project document
    project_doc = {
        "title": project_data.title,
        "user_id": user_id_obj,
        "video_filename": project_data.video_filename,
        "video_url": project_data.video_url,
        "segments": [seg.model_dump() for seg in project_data.segments],
        "global_style": project_data.global_style.model_dump() if project_data.global_style else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "thumbnail_url": None
    }
    
    result = await projects_collection.insert_one(project_doc)
    
    # Fetch the created project
    created_project = await projects_collection.find_one({"_id": result.inserted_id})
    return _project_doc_to_response(created_project)

async def get_project(project_id: str) -> Optional[ProjectResponse]:
    """Get a project by ID"""
    db = get_database()
    projects_collection = db["projects"]
    
    try:
        project_doc = await projects_collection.find_one({"_id": ObjectId(project_id)})
        if not project_doc:
            return None
        return _project_doc_to_response(project_doc)
    except Exception:
        return None

async def get_projects(user_id: Optional[str] = None) -> List[ProjectResponse]:
    """Get all projects, optionally filtered by user_id"""
    db = get_database()
    projects_collection = db["projects"]
    
    query = {}
    if user_id:
        try:
            query["user_id"] = ObjectId(user_id)
        except Exception:
            pass
    
    cursor = projects_collection.find(query).sort("updated_at", -1)
    projects = []
    async for doc in cursor:
        projects.append(_project_doc_to_response(doc))
    
    return projects

async def update_project(project_id: str, project_update: ProjectUpdate) -> Optional[ProjectResponse]:
    """Update a project"""
    db = get_database()
    projects_collection = db["projects"]
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if project_update.title is not None:
        update_data["title"] = project_update.title
    if project_update.video_filename is not None:
        update_data["video_filename"] = project_update.video_filename
    if project_update.video_url is not None:
        update_data["video_url"] = project_update.video_url
    if project_update.segments is not None:
        update_data["segments"] = [seg.model_dump() for seg in project_update.segments]
    if project_update.global_style is not None:
        update_data["global_style"] = project_update.global_style.model_dump()
    
    try:
        result = await projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return None
        
        # Fetch updated project
        updated_project = await projects_collection.find_one({"_id": ObjectId(project_id)})
        return _project_doc_to_response(updated_project)
    except Exception:
        return None

async def delete_project(project_id: str) -> bool:
    """Delete a project"""
    db = get_database()
    projects_collection = db["projects"]
    
    try:
        result = await projects_collection.delete_one({"_id": ObjectId(project_id)})
        return result.deleted_count > 0
    except Exception:
        return False

def _project_doc_to_response(doc: dict) -> ProjectResponse:
    """Convert MongoDB document to ProjectResponse"""
    # Convert segments
    segments = []
    for seg_data in doc.get("segments", []):
        segments.append(Segment(**seg_data))
    
    # Convert global_style
    global_style = None
    if doc.get("global_style"):
        global_style = GlobalStyle(**doc["global_style"])
    
    return ProjectResponse(
        id=str(doc["_id"]),
        title=doc["title"],
        user_id=str(doc["user_id"]) if doc.get("user_id") else None,
        video_filename=doc.get("video_filename"),
        video_url=doc.get("video_url"),
        segments=segments,
        global_style=global_style,
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        thumbnail_url=doc.get("thumbnail_url")
    )

