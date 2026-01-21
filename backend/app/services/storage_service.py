"""
Cloudinary storage service for video uploads
"""
import cloudinary
import cloudinary.uploader
from app.config import settings

# Configure Cloudinary once at import
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

def upload_video(file_path: str, folder: str = "captioncraft", public_id: str = None):
    """
    Upload a video file to Cloudinary
    
    Args:
        file_path: Path to the video file to upload
        folder: Cloudinary folder to store the video in
        public_id: Optional custom public_id for the video
    
    Returns:
        dict: Cloudinary upload result containing 'secure_url', 'public_id', etc.
    """
    upload_options = {
        "resource_type": "video",
        "folder": folder,
    }
    
    if public_id:
        upload_options["public_id"] = public_id
    
    # Use upload preset if configured
    if settings.CLOUDINARY_UPLOAD_PRESET:
        upload_options["upload_preset"] = settings.CLOUDINARY_UPLOAD_PRESET
    
    result = cloudinary.uploader.upload(file_path, **upload_options)
    return result

def delete_video(public_id: str):
    """
    Delete a video from Cloudinary
    
    Args:
        public_id: The public_id of the video to delete (can include folder path)
    
    Returns:
        dict: Cloudinary deletion result
    """
    result = cloudinary.uploader.destroy(public_id, resource_type="video")
    return result

