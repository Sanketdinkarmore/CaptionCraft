from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database.models import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import (
    create_project,
    get_project,
    get_projects,
    update_project,
    delete_project
)

router = APIRouter(tags=["projects"])

@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def save_project(project: ProjectCreate):
    """Save a new project"""
    try:
        created_project = await create_project(project)
        return created_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")

@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(user_id: Optional[str] = Query(None, description="Filter by user ID (optional)")):
    """Get all projects, optionally filtered by user_id"""
    try:
        projects = await get_projects(user_id=user_id)
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def load_project(project_id: str):
    """Load a project by ID"""
    project = await get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project_route(project_id: str, project_update: ProjectUpdate):
    """Update a project"""
    updated_project = await update_project(project_id, project_update)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@router.delete("/projects/{project_id}", status_code=204)
async def delete_project_route(project_id: str):
    """Delete a project"""
    success = await delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return None

