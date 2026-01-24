"""
Thumbnail generation and upload service
"""
import subprocess
from pathlib import Path
import cloudinary.uploader
from app.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

def generate_thumbnail_from_video(video_path: str, time_offset: float = None) -> str:
    """
    Extract a frame from video as thumbnail image file
    
    Args:
        video_path: Path to video file
        time_offset: Time in seconds to extract frame (default: 1 second)
    
    Returns:
        Path to generated thumbnail image
    """
    thumbnail_path = str(Path(video_path).with_suffix('.jpg'))
    
    # If no time specified, extract at 1 second
    if time_offset is None:
        time_offset = 1.0
    
    cmd = [
        "ffmpeg", "-i", video_path,
        "-ss", str(time_offset),
        "-vframes", "1",
        "-q:v", "2",  # High quality (scale 1-31, lower = better)
        "-y", thumbnail_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return thumbnail_path
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode() if e.stderr else str(e)
        raise Exception(f"Failed to generate thumbnail: {error_msg}")

def upload_thumbnail_to_cloudinary(thumbnail_path: str, folder: str = "captioncraft/thumbnails") -> str:
    """
    Upload thumbnail image to Cloudinary
    
    Args:
        thumbnail_path: Path to thumbnail image file
        folder: Cloudinary folder path
    
    Returns:
        Cloudinary secure URL
    """
    result = cloudinary.uploader.upload(
        thumbnail_path,
        resource_type="image",
        folder=folder,
    )
    return result.get("secure_url")

def upload_custom_thumbnail(image_file_path: str, folder: str = "captioncraft/thumbnails") -> str:
    """
    Upload a custom image file as thumbnail
    
    Args:
        image_file_path: Path to image file (jpg, png, etc.)
        folder: Cloudinary folder path
    
    Returns:
        Cloudinary secure URL
    """
    result = cloudinary.uploader.upload(
        image_file_path,
        resource_type="image",
        folder=folder,
    )
    return result.get("secure_url")

