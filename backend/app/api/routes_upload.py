"""
API routes for file uploads (Cloudinary)
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import tempfile
import os
from app.api.routes_auth import get_current_user
from app.services.storage_service import upload_video
from app.database.models import UserInDB

router = APIRouter(tags=["upload"])

@router.post("/upload/video")
async def upload_video_route(
    video: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload a video file to Cloudinary
    
    Requires authentication. Returns the Cloudinary URL for the uploaded video.
    """
    # Validate file type
    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail="File must be a video"
        )
    
    # Create temporary file
    temp_file = None
    try:
        # Create a temporary file with appropriate extension
        suffix = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            # Read video content
            content = await video.read()
            tmp.write(content)
            temp_file = tmp.name
        
        # Upload to Cloudinary
        # Use user_id in folder structure for organization
        folder = f"captioncraft/user_{current_user.id}"
        result = upload_video(temp_file, folder=folder)
        
        # Return Cloudinary URL and metadata
        return {
            "video_url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "resource_type": result.get("resource_type"),
            "duration": result.get("duration"),
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "bytes": result.get("bytes"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception:
                pass  # Ignore cleanup errors

