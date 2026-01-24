from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import subprocess
from pathlib import Path
import uuid
from tempfile import gettempdir
import os

try:
    from fontTools.ttLib import TTFont
    FONTTOOLS_AVAILABLE = True
except ImportError:
    FONTTOOLS_AVAILABLE = False

router = APIRouter(tags=["render"])

PLAYRES_X = 1920
PLAYRES_Y = 1080

# Path to bundled fonts directory
FONTS_DIR = Path(__file__).parent.parent / "fonts"

# Cache for font name mappings (filename -> actual font name)
_font_name_cache: Dict[str, str] = {}

def get_font_name_from_file(font_path: Path) -> str:
    """
    Extract the actual font name from a TTF file.
    Returns the font name that FFmpeg will recognize.
    """
    if font_path.name in _font_name_cache:
        return _font_name_cache[font_path.name]
    
    font_name = font_path.stem  # Default to filename without extension
    
    if FONTTOOLS_AVAILABLE:
        try:
            font = TTFont(str(font_path))
            name_table = font.get("name")
            
            # Try to get the preferred font name (nameID 4 = Full font name)
            # Also try nameID 6 = PostScript name, nameID 1 = Family name
            for name_id in [4, 6, 1]:
                for record in name_table.names:
                    if record.nameID == name_id and record.isUnicode():
                        font_name = record.toUnicode()
                        break
                if font_name != font_path.stem:
                    break
        except Exception as e:
            print(f"Warning: Could not extract font name from {font_path.name}: {e}")
    
    _font_name_cache[font_path.name] = font_name
    return font_name

def build_font_map() -> Dict[str, str]:
    """
    Build a mapping from frontend font family names to actual font names.
    Scans the fonts directory and maps common names to TTF files.
    """
    font_map: Dict[str, str] = {}
    
    if not FONTS_DIR.exists():
        print(f"Warning: Fonts directory not found: {FONTS_DIR}")
        return font_map
    
    # Map common frontend names to font files
    name_to_file = {
        "Inter": "Inter_24pt-Regular.ttf",
        "Poppins": "Poppins-Regular.ttf",
        "Roboto": "Roboto_Condensed-Regular.ttf",
        "RobotoCondensed": "Roboto_Condensed-Regular.ttf",
        "Montserrat": "Montserrat-Regular.ttf",
        "Orbitron": "Orbitron-Regular.ttf",
        "CourierPrime": "CourierPrime-Regular.ttf",
        "Courier Prime": "CourierPrime-Regular.ttf",
        "PlayfairDisplay": "PlayfairDisplay-Regular.ttf",
        "Playfair Display": "PlayfairDisplay-Regular.ttf",
    }
    
    for frontend_name, filename in name_to_file.items():
        font_path = FONTS_DIR / filename
        if font_path.exists():
            actual_name = get_font_name_from_file(font_path)
            font_map[frontend_name] = actual_name
        else:
            print(f"Warning: Font file not found: {filename}")
    
    # System fonts that don't need files
    font_map["Arial"] = "Arial"
    font_map["Impact"] = "Impact"
    
    return font_map

# Initialize font map
FONT_MAP = build_font_map()

def get_font_name(font_family: str) -> str:
    """
    Maps frontend font family name to the actual font name that FFmpeg can find.
    Returns the font name to use in ASS file.
    """
    # Extract base font name (remove fallbacks like "Inter, system-ui, sans-serif")
    base_name = font_family.split(",")[0].strip()
    
    # Check if we have a bundled font for this
    if base_name in FONT_MAP:
        return FONT_MAP[base_name]
    
    # Fallback: try to clean the name and check again
    cleaned_name = base_name.replace(" ", "")
    if cleaned_name in FONT_MAP:
        return FONT_MAP[cleaned_name]
    
    # Final fallback: return the original name (might be a system font)
    return base_name.replace(" ", "")

class Position(BaseModel):
    x: float | None = None
    y: float | None = None

class StyledSpan(BaseModel):
    text: str
    color: str | None = None
    fontWeight: str | None = None
    fontFamily: str | None = None
    fontSize: float | None = None
    underline: bool | None = False
    background: str | None = None

class Segment(BaseModel):
    start: float
    end: float
    content: List[StyledSpan]
    position: Position | None = None

def format_time_ass(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int((seconds % 1) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

def hex_to_ass(color: str) -> str:
    hex_val = color.lstrip("#")
    if len(hex_val) != 6:
        return "&HFFFFFF&"
    rr, gg, bb = hex_val[0:2], hex_val[2:4], hex_val[4:6]
    return f"&H{bb}{gg}{rr}&"

def build_ass(segments: List[Segment], global_style: Dict[str, Any]) -> str:
    # Use the font mapping function to get the correct font name
    font_family = get_font_name(global_style.get("fontFamily", "Arial"))
    font_size = int(global_style.get("fontSize", 48))
    primary_color = hex_to_ass(global_style.get("color", "#FFFFFF"))
    
    header = f"""[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: {PLAYRES_X}
PlayResY: {PLAYRES_Y}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_family},{font_size},{primary_color},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,1.8,2,10,10,60,1
"""
    # Note: Shadow set to 1.5 in global style for better readability.
    
    header += """
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]

    for seg in segments:
        start = format_time_ass(seg.start)
        end = format_time_ass(seg.end)

        px = int(seg.position.x * PLAYRES_X if seg.position and seg.position.x is not None else 0.5 * PLAYRES_X)
        py = int(seg.position.y * PLAYRES_Y if seg.position and seg.position.y is not None else 0.9 * PLAYRES_Y)

        # Apply global position and a soft blur (\be1) to the shadow for a cleaner look
        line_text = f"{{\\pos({px},{py})\\be1}}"

        for span in seg.content:
            tags = []
            
            # 1. Base Styling
            current_color = span.color or global_style.get("color")
            if current_color:
                tags.append(f"\\c{hex_to_ass(current_color)}")
            
            # Font family override for individual spans (using \fn tag)
            if span.fontFamily:
                span_font_name = get_font_name(span.fontFamily)
                tags.append(f"\\fn{span_font_name}")
            
            if span.fontSize:
                tags.append(f"\\fs{int(span.fontSize)}")

            # 2. Glow Logic (The "Box" around styled words)
            if span.background:
                glow_color = hex_to_ass(span.background)
                tags.append(f"\\3c{glow_color}") 
                tags.append("\\bord4")  # Thick border for glow effect
            else:
                # RESET to thin black outline for normal words
                tags.append("\\3c&H000000&")
                tags.append("\\bord2")

            # 3. Readability Shadow (Forces a small shadow even on styled words)
            tags.append("\\shad1.5") 

            # 4. Font Weight & Underline
            tags.append(f"\\b{1 if span.fontWeight == 'bold' else 0}")
            tags.append(f"\\u{1 if span.underline else 0}")

            line_text += "{" + "".join(tags) + "}" + span.text

        lines.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{line_text}\n")

    return "".join(lines)

@router.post("/render")
async def render_video(
    video: UploadFile = File(...),
    segments: str = Form(...),
    globalStyle: str = Form(""),
    resolution: str = Form("original"),  # "original", "720p", "1080p"
):
    try:
        raw_segs = json.loads(segments)
        seg_models = [Segment.model_validate(obj) for obj in raw_segs]
        g_style = json.loads(globalStyle) if globalStyle else {}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data error: {str(e)}")

    tmp = Path(gettempdir())
    session_id = uuid.uuid4().hex
    v_in = tmp / f"in_{session_id}.mp4"
    v_out = tmp / f"out_{session_id}.mp4"
    ass_file = tmp / f"subs_{session_id}.ass"
    
    # Create a temporary fonts directory to avoid Windows path issues with colons
    tmp_fonts_dir = tmp / f"fonts_{session_id}"
    tmp_fonts_dir.mkdir(exist_ok=True)

    with v_in.open("wb") as f:
        f.write(await video.read())

    ass_file.write_text(build_ass(seg_models, g_style), encoding="utf-8")

    # IMPORTANT: The 'fontsdir' parameter doesn't exist in FFmpeg's subtitles filter!
    # Instead, we need to:
    # 1. Copy fonts to the same directory as the ASS file (libass looks there)
    # 2. Use fontconfig environment variables
    # 3. Or rely on system fonts
    
    import shutil
    ass_file_dir = ass_file.parent
    
    # Copy bundled fonts to the same directory as the ASS file
    # libass (used by FFmpeg subtitles filter) will look for fonts in the ASS file's directory
    if FONTS_DIR.exists():
        for font_file in FONTS_DIR.glob("*.ttf"):
            try:
                shutil.copy2(font_file, ass_file_dir / font_file.name)
            except Exception as e:
                print(f"Warning: Could not copy font {font_file.name}: {e}")

    # Prepare path for FFmpeg
    # The issue: FFmpeg filter parser on Windows has trouble with colons in absolute paths
    # Solution: Change working directory to temp folder and use relative paths
    # This completely avoids the colon parsing issue
    
    # Get relative paths from temp directory
    ass_filename = ass_file.name
    v_in_filename = v_in.name
    v_out_filename = v_out.name
    
    # Build filter chain with optional scaling based on resolution
    # Apply scaling BEFORE subtitles for better quality
    if resolution == "720p":
        # Scale to 720p, then apply subtitles
        subtitles_filter = f"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,subtitles={ass_filename}"
    elif resolution == "1080p":
        # Scale to 1080p, then apply subtitles
        subtitles_filter = f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,subtitles={ass_filename}"
    else:
        # "original" means no scaling, just subtitles
        subtitles_filter = f"subtitles={ass_filename}"
    
    # Set up fontconfig environment
    env = os.environ.copy()
    env["FONTCONFIG_PATH"] = str(ass_file_dir.resolve())
    
    # Debug output
    print(f"FFmpeg filter: {subtitles_filter}")
    print(f"Working directory: {tmp}")
    print(f"ASS file: {ass_filename}")
    print(f"Fonts directory: {ass_file_dir}")
    
    # Build FFmpeg command
    # The scale filter already handles resolution, so we don't need -s flag
    cmd = [
        "ffmpeg", "-y", "-i", v_in_filename,
        "-vf", subtitles_filter,
        "-c:v", "libx264", "-preset", "medium", "-crf", "23",
        "-c:a", "copy", v_out_filename
    ]

    thumbnail_path = None
    try:
        # Change to temp directory before running FFmpeg
        # This allows us to use relative paths and avoid colon issues
        result = subprocess.run(
            cmd, 
            check=True, 
            capture_output=True, 
            text=True, 
            env=env,
            cwd=str(tmp)  # Run FFmpeg from temp directory
        )
        if result.stderr:
            # Log FFmpeg output for debugging (non-fatal warnings are common)
            print("FFmpeg output:", result.stderr[:500])  # First 500 chars
        
        # Generate thumbnail from rendered video (for poster image)
        try:
            from app.services.thumbnail_service import generate_thumbnail_from_video, upload_thumbnail_to_cloudinary
            thumbnail_path = generate_thumbnail_from_video(str(v_out), time_offset=1.0)
            # Upload thumbnail to Cloudinary (optional - can return local path for now)
            # For now, we'll return the thumbnail path in the response
        except Exception as thumb_err:
            print(f"Warning: Failed to generate rendered video thumbnail: {thumb_err}")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        print(f"FFmpeg error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Rendering failed: {error_msg[:200]}")
    finally:
        # Cleanup temporary files
        if ass_file.exists(): 
            os.remove(ass_file)
        if v_in.exists(): 
            os.remove(v_in)
        # Cleanup temporary fonts directory
        if tmp_fonts_dir.exists():
            import shutil
            try:
                shutil.rmtree(tmp_fonts_dir)
            except Exception as e:
                print(f"Warning: Could not remove temp fonts dir: {e}")

    # Return file name and thumbnail path if generated
    response = {"file_name": v_out.name}
    if thumbnail_path and Path(thumbnail_path).exists():
        response["thumbnail_path"] = thumbnail_path
    
    return response

@router.get("/render/download/{file_name}")
async def download(file_name: str):
    path = Path(gettempdir()) / file_name
    return FileResponse(path, media_type="video/mp4", filename="rendered_video.mp4")