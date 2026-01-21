from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.database.models import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import (
    create_project,
    get_project,
    get_projects,
    update_project,
    delete_project,
)
from app.api.routes_auth import get_current_user

router = APIRouter(tags=["projects"])


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def save_project(project: ProjectCreate, user=Depends(get_current_user)):
    """Save a new project for the current user"""
    try:
        # Force user_id to the authenticated user, ignore any client-sent user_id
        project.user_id = str(user.id)
        created_project = await create_project(project)
        return created_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(user=Depends(get_current_user)):
    """Get all projects for the current user"""
    try:
        projects = await get_projects(user_id=str(user.id))
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def load_project(project_id: str, user=Depends(get_current_user)):
    """Load a project by ID for the current user"""
    project = await get_project(project_id, user_id=str(user.id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project_route(
    project_id: str,
    project_update: ProjectUpdate,
    user=Depends(get_current_user),
):
    """Update a project belonging to the current user"""
    updated_project = await update_project(project_id, project_update, user_id=str(user.id))
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project


@router.delete("/projects/{project_id}", status_code=204)
async def delete_project_route(project_id: str, user=Depends(get_current_user)):
    """Delete a project belonging to the current user"""
    success = await delete_project(project_id, user_id=str(user.id))
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return None

