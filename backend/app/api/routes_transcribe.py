from fastapi import APIRouter, UploadFile, File
import tempfile
import subprocess
from app.services.asr_service import transcribe_audio_to_segments

router = APIRouter(prefix="/api", tags=["transcription"])


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
async def transcribe_video(file: UploadFile = File(...)):
    # 1) Save uploaded video to a temporary file
    suffix = "." + file.filename.split(".")[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        video_path = tmp.name

    # 2) Extract audio from video
    audio_path = extract_audio(video_path)

    # 3) Run ASR to get segments
    segments = transcribe_audio_to_segments(audio_path)

    # 4) Return segments JSON to frontend
    return {"segments": segments}
