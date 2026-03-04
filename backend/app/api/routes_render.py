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
import requests

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
    
    # Apply 1.2x font size multiplier for render
    # This makes rendered text 20% larger than preview
    frontend_font_size = global_style.get("fontSize", 36)
    font_size = int(frontend_font_size * 2.5)
    
    primary_color = hex_to_ass(global_style.get("color", "#FFFFFF"))
    
    # Evenflow-style ASS subtitle format:
    # - Bold text (-1 = super bold)
    # - Medium black outline (2px) to avoid heavy shadow look
    # - NO shadow (0)
    # - NO background box (BackColour transparent)
    # - BorderStyle 1 (outline and drop shadow, but shadow=0 so just outline)
    header = f"""[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: {PLAYRES_X}
PlayResY: {PLAYRES_Y}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_family},{font_size},{primary_color},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,60,1
"""
    # Key changes from original:
    # - Bold: 0 → -1 (super bold, like Evenflow)
    # - Outline: 1 → 2 (medium black outline so shadow looks lighter than before)
    # - Shadow: 1.8 → 0 (no drop shadow, just clean outline)
    # - BackColour: &H80000000 → &H00000000 (fully transparent, no background box)
    
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

        # Evenflow style: clean positioning, no blur effect
        line_text = f"{{\\pos({px},{py})}}"

        for span in seg.content:
            tags = []
            
            # 1. Text Color
            current_color = span.color or global_style.get("color")
            if current_color:
                tags.append(f"\\c{hex_to_ass(current_color)}")
            
            # 2. Font family override
            if span.fontFamily:
                span_font_name = get_font_name(span.fontFamily)
                tags.append(f"\\fn{span_font_name}")
            
            # 3. Font size override
            if span.fontSize:
                # Apply same 1.2x multiplier to span font sizes
                tags.append(f"\\fs{int(span.fontSize * 2.5)}")

            # 4. OUTLINE STYLE (Evenflow approach)
            # For styled words with background, use the background color as outline
            if span.background:
                outline_color = hex_to_ass(span.background)
                tags.append(f"\\3c{outline_color}")  # Outline color
                tags.append("\\bord3")  # Slightly thicker outline for styled words, but lighter than before
            else:
                # Default: medium black outline for ALL words (Evenflow style, less "shadowy")
                tags.append("\\3c&H000000&")  # Black outline
                tags.append("\\bord2")  # Medium outline to reduce heavy shadow feel

            # 5. NO SHADOW (clean Evenflow look)
            tags.append("\\shad0")

            # 6. Bold (make styled words even bolder if needed)
            is_bold = span.fontWeight == "bold" or global_style.get("fontWeight") == "bold"
            tags.append(f"\\b{1 if is_bold else -1}")  # -1 is already bold from style, 1 is extra bold
            
            # 7. Underline
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
    music_url: str | None = Form(None),
    music_volume: float = Form(0.3),
):
    # Log the resolution parameter for debugging
    print(f"[RENDER] Resolution requested: {resolution}")
    
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
    music_path = None
    
    # Create a temporary fonts directory to avoid Windows path issues with colons
    tmp_fonts_dir = tmp / f"fonts_{session_id}"
    tmp_fonts_dir.mkdir(exist_ok=True)

    with v_in.open("wb") as f:
        f.write(await video.read())

    ass_file.write_text(build_ass(seg_models, g_style), encoding="utf-8")

    # If a music URL is provided, download it to a temporary file for FFmpeg
    if music_url:
        try:
            music_path = tmp / f"music_{session_id}.mp3"
            resp = requests.get(music_url, stream=True, timeout=30)
            resp.raise_for_status()
            with music_path.open("wb") as mf:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        mf.write(chunk)
        except Exception as e:
            print(f"[RENDER] Warning: Failed to download music from {music_url}: {e}")
            music_path = None

    # libass (used by FFmpeg subtitles filter) needs fontsdir on Windows - it does NOT
    # use fontconfig there. The fontsdir option explicitly tells libass where to find fonts.
    import shutil
    ass_file_dir = ass_file.parent
    
    # Copy bundled fonts to the same directory as the ASS file
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
    # fontsdir=. tells libass to load fonts from current dir (critical on Windows where fontconfig is not used)
    subtitles_part = f"subtitles={ass_filename}:fontsdir=."
    if resolution == "720p":
        # Scale to 720p, then apply subtitles
        subtitles_filter = f"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=black,{subtitles_part}"
    elif resolution == "1080p":
        # Scale to 1080p, then apply subtitles
        subtitles_filter = f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,{subtitles_part}"
    else:
        # "original" means no scaling, just subtitles
        subtitles_filter = subtitles_part
    
    # Set up fontconfig environment
    env = os.environ.copy()
    env["FONTCONFIG_PATH"] = str(ass_file_dir.resolve())
    
    # Debug output
    resolved_font = get_font_name(g_style.get("fontFamily", "Arial"))
    print(f"[RENDER] Resolution: {resolution}")
    print(f"[RENDER] Font requested: {g_style.get('fontFamily', 'Arial')} -> ASS Fontname: {resolved_font}")
    print(f"[RENDER] Frontend font size: {g_style.get('fontSize', 36)} -> ASS font size: {int(g_style.get('fontSize', 36) * 2.5)} (1.2x larger)")
    print(f"[RENDER] FONTS_DIR exists: {FONTS_DIR.exists()}, fonts copied: {list(ass_file_dir.glob('*.ttf'))}")
    print(f"[RENDER] FFmpeg filter: {subtitles_filter}")
    print(f"[RENDER] Working directory: {tmp}")
    print(f"[RENDER] ASS file: {ass_filename}")
    
    # Build FFmpeg command
    # The scale filter already handles resolution, so we don't need -s flag
    if music_path and music_path.exists():
        # Use a second input for music, loop it, and mix with original audio
        music_filename = music_path.name
        # Ensure volume is within 0–1
        music_volume_clamped = max(0.0, min(1.0, float(music_volume)))
        audio_filter = (
            f"[0:a]volume=1.0[a0];"
            f"[1:a]volume={music_volume_clamped}[a1];"
            f"[a0][a1]amix=inputs=2:duration=shortest[aout]"
        )
        cmd = [
            "ffmpeg",
            "-y",
            "-i", v_in_filename,
            "-stream_loop", "-1", "-i", music_filename,
            "-vf", subtitles_filter,
            "-filter_complex", audio_filter,
            "-map", "0:v",
            "-map", "[aout]",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "192k",
            v_out_filename,
        ]
    else:
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
            # Log FFmpeg output for debugging
            print("[RENDER] FFmpeg output:", result.stderr[:500])  # First 500 chars
        
        # Verify output video resolution using ffprobe
        output_resolution = None
        try:
            probe_cmd = [
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream=width,height",
                "-of", "json", v_out_filename
            ]
            probe_result = subprocess.run(
                probe_cmd,
                check=True,
                capture_output=True,
                text=True,
                cwd=str(tmp)
            )
            import json as json_lib
            probe_data = json_lib.loads(probe_result.stdout)
            if "streams" in probe_data and len(probe_data["streams"]) > 0:
                stream = probe_data["streams"][0]
                output_resolution = f"{stream.get('width')}x{stream.get('height')}"
                print(f"[RENDER] Output video resolution: {output_resolution}")
        except Exception as probe_err:
            print(f"[RENDER] Warning: Could not verify output resolution: {probe_err}")
        
        # Generate thumbnail from rendered video (for poster image)
        try:
            from app.services.thumbnail_service import generate_thumbnail_from_video, upload_thumbnail_to_cloudinary
            thumbnail_path = generate_thumbnail_from_video(str(v_out), time_offset=1.0)
            # Upload thumbnail to Cloudinary (optional - can return local path for now)
            # For now, we'll return the thumbnail path in the response
        except Exception as thumb_err:
            print(f"[RENDER] Warning: Failed to generate rendered video thumbnail: {thumb_err}")
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
        if music_path and music_path.exists():
            os.remove(music_path)
        # Cleanup temporary fonts directory
        if tmp_fonts_dir.exists():
            import shutil
            try:
                shutil.rmtree(tmp_fonts_dir)
            except Exception as e:
                print(f"Warning: Could not remove temp fonts dir: {e}")

    # Return file name, thumbnail path, and output resolution if available
    response = {"file_name": v_out.name}
    if thumbnail_path and Path(thumbnail_path).exists():
        response["thumbnail_path"] = thumbnail_path
    if output_resolution:
        response["output_resolution"] = output_resolution
    
    return response

@router.get("/render/download/{file_name}")
async def download(file_name: str):
    path = Path(gettempdir()) / file_name
    return FileResponse(path, media_type="video/mp4", filename="rendered_video.mp4")