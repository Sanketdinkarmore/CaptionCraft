from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import json
import subprocess
from pathlib import Path
import uuid
from tempfile import gettempdir
import os

router = APIRouter(tags=["render"])

PLAYRES_X = 1920
PLAYRES_Y = 1080

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
    font_family = global_style.get("fontFamily", "Arial").split(",")[0].strip().replace(" ", "")
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
    ass_file = Path(".").resolve() / f"subs_{session_id}.ass"

    with v_in.open("wb") as f:
        f.write(await video.read())

    ass_file.write_text(build_ass(seg_models, g_style), encoding="utf-8")

    cmd = [
        "ffmpeg", "-y", "-i", str(v_in),
        "-vf", f"subtitles='{ass_file.name}'",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "22",
        "-c:a", "copy", str(v_out)
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    finally:
        if ass_file.exists(): os.remove(ass_file)
        # Cleanup of input video is optional, but helps save space
        if v_in.exists(): os.remove(v_in)

    return {"file_name": v_out.name}

@router.get("/render/download/{file_name}")
async def download(file_name: str):
    path = Path(gettempdir()) / file_name
    return FileResponse(path, media_type="video/mp4", filename="rendered_video.mp4")