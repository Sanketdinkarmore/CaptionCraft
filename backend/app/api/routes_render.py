from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List
import json
import subprocess
from pathlib import Path
import uuid
from tempfile import gettempdir
from fastapi.responses import FileResponse


router = APIRouter(tags=["render"])


class StyledSpan(BaseModel):
    text: str
    color: str | None = None
    fontWeight: str | None = None
    fontFamily: str | None = None
    underline: bool | None = False


class Segment(BaseModel):
    start: float
    end: float
    content: List[StyledSpan]


def format_time_ass(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int((seconds % 1) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"


def hex_to_ass(color: str) -> str:
    # "#RRGGBB" -> "&HBBGGRR&"
    hex_val = color.lstrip("#")
    if len(hex_val) != 6:
        return "&HFFFFFF&"
    rr = hex_val[0:2]
    gg = hex_val[2:4]
    bb = hex_val[4:6]
    return f"&H{bb}{gg}{rr}&"


def build_ass(segments: List[Segment]) -> str:
    header = """[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]

    for seg in segments:
        start = format_time_ass(seg.start)
        end = format_time_ass(seg.end)

        text_parts: list[str] = []
        for span in seg.content:
            tags: list[str] = []
            if span.color:
                tags.append(f"\\c{hex_to_ass(span.color)}")
            if span.fontWeight == "bold":
                tags.append("\\b1")
            if span.fontFamily:
                tags.append(f"\\fn{span.fontFamily}")
            if span.underline:
                tags.append("\\u1")

            if tags:
                text_parts.append("{" + "".join(tags) + "}" + span.text)
            else:
                text_parts.append(span.text)

        line_text = "".join(text_parts).replace("\n", "\\N")
        lines.append(
            f"Dialogue: 0,{start},{end},Default,,0,0,0,,{line_text}\n"
        )

    return "".join(lines)


@router.post("/render")
async def render_video(
    video: UploadFile = File(...),
    segments: str = Form(...),
):
    # --- debug log basic info ---
    print("---- /render called ----")
    print("segments length:", len(segments))

    # 1) Parse JSON
    try:
        raw = json.loads(segments)
        print("parsed segments count:", len(raw))
        seg_models = [Segment.model_validate(obj) for obj in raw]
    except Exception as e:
        print("JSON / validation error in segments:", repr(e))
        raise HTTPException(status_code=400, detail="Invalid segments JSON")

    # 2) Temp paths
    tmp_dir = Path(gettempdir())
    uid = uuid.uuid4().hex

    video_path = tmp_dir / f"src_{uid}.mp4"
    ass_path = tmp_dir / f"subs_{uid}.ass"
    out_path = tmp_dir / f"out_{uid}.mp4"

    print("video_path:", video_path)
    print("ass_path:", ass_path)
    print("out_path:", out_path)

    # 3) Save uploaded video
    with video_path.open("wb") as f:
        f.write(await video.read())

    # 4) Build ASS subtitles
    ass_content = build_ass(seg_models)
    ass_path.write_text(ass_content, encoding="utf-8")

    # 5) Use a relative ASS path to avoid Windows escaping issues
    #    Copy the .ass file into the current working directory and use only its filename.
    cwd = Path(".").resolve()
    ass_target = cwd / ass_path.name
    ass_target.write_text(ass_content, encoding="utf-8")

    # subtitles filter just needs the filename, no drive letters or slashes
    sub_filter = f"subtitles={ass_target.name}"
    print("ffmpeg subtitles filter:", sub_filter)

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-vf",
        sub_filter,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "23",
        "-c:a",
        "copy",
        str(out_path),
    ]

    print("ffmpeg cmd:", " ".join(cmd))

    try:
        proc = subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
        )
    except subprocess.CalledProcessError as e:
        print("FFmpeg FAILED, stderr:")
        print(e.stderr)
        raise HTTPException(status_code=500, detail="FFmpeg render failed")

    print("FFmpeg finished OK")
    return {"file_name": out_path.name}

#downlaod folder configuration
@router.get("/render/download/{file_name}")
async def download_rendered_video(file_name: str):
    """
    Serve the rendered mp4 from the temp folder so the browser can download it.
    """
    tmp_dir = Path(gettempdir())
    file_path = tmp_dir / file_name

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # Tell the browser it's an mp4 and suggest a filename
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=file_name,
    )