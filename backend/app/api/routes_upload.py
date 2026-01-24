"""
API routes for file uploads (Cloudinary)
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import tempfile
import os
from app.api.routes_auth import get_current_user
from app.services.storage_service import upload_video
from app.services.thumbnail_service import (
    generate_thumbnail_from_video,
    upload_thumbnail_to_cloudinary,
    upload_custom_thumbnail
)
from app.database.models import UserInDB

router = APIRouter(tags=["upload"])

@router.post("/upload/video")
async def upload_video_route(
    video: UploadFile = File(...),
    generate_thumbnail: bool = Form(True),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload a video file to Cloudinary
    
    If generate_thumbnail is True, automatically generates and uploads thumbnail.
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
    thumbnail_path = None
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
        
        # Generate thumbnail if requested
        thumbnail_url = None
        if generate_thumbnail:
            try:
                # Generate thumbnail from video
                thumbnail_path = generate_thumbnail_from_video(temp_file)
                # Upload thumbnail to Cloudinary
                thumbnail_url = upload_thumbnail_to_cloudinary(
                    thumbnail_path,
                    folder=f"{folder}/thumbnails"
                )
            except Exception as e:
                print(f"Warning: Failed to generate thumbnail: {e}")
                # Don't fail the upload if thumbnail generation fails
        
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
            "thumbnail_url": thumbnail_url,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
    finally:
        # Clean up temporary files
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception:
                pass
        if thumbnail_path and os.path.exists(thumbnail_path):
            try:
                os.unlink(thumbnail_path)
            except Exception:
                pass

@router.post("/upload/thumbnail")
async def upload_thumbnail_route(
    image: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload a custom thumbnail image
    
    Accepts: jpg, jpeg, png, webp
    Returns: Cloudinary URL of uploaded thumbnail
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if not image.content_type or image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="File must be an image (jpg, png, webp)"
        )
    
    temp_file = None
    try:
        # Create temporary file
        suffix = os.path.splitext(image.filename or "thumbnail.jpg")[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await image.read()
            tmp.write(content)
            temp_file = tmp.name
        
        # Upload to Cloudinary
        folder = f"captioncraft/user_{current_user.id}/thumbnails"
        thumbnail_url = upload_custom_thumbnail(temp_file, folder=folder)
        
        return {
            "thumbnail_url": thumbnail_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.unlink(temp_file)
            except Exception:
                pass

