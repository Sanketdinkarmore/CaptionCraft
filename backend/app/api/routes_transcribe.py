from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tempfile
import subprocess
from app.services.asr_service import transcribe_audio_to_segments

router = APIRouter(tags=["transcription"])


def extract_audio(video_path: str) -> str:
    """
    Uses ffmpeg to extract mono 16kHz WAV from the uploaded video.
    """
    audio_path = video_path + ".wav"
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        video_path,
        "-ac",
        "1",
        "-ar",
        "16000",
        audio_path,
    ]
    subprocess.run(cmd, check=True)
    return audio_path


@router.post("/transcribe")
async def transcribe_video(
    file: UploadFile = File(...),
    language: str = Form(...)  # REQUIRED - no default
):
    """
    Transcribe video audio with user-selected language.
    
    Supported languages (MUST select one):
    - "hinglish": Hinglish (Hindi + English mix)
    - "hindi": Pure Hindi
    - "marathi": Marathi
    - "english": English
    """
    # Validate language - NO AUTO-DETECT
    valid_languages = ["hinglish", "hindi", "marathi", "english"]
    if language not in valid_languages:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language '{language}'. Must be one of: {valid_languages}"
        )
    
    # 1) Save uploaded video to a temporary file
    suffix = "." + file.filename.split(".")[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        video_path = tmp.name

    # 2) Extract audio from video
    audio_path = extract_audio(video_path)

    # 3) Run ASR with user-selected language
    segments = transcribe_audio_to_segments(audio_path, language=language)

    # 4) Return segments JSON to frontend
    return {
        "segments": segments,
        "selected_language": language
    }