import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from functools import lru_cache

# Multi-model setup - NO AUTO-DETECT
MODEL_MAP = {
    "hinglish": "Oriserve/Whisper-Hindi2Hinglish-Apex",
    "hindi": "openai/whisper-medium",
    "marathi": "openai/whisper-medium",
    "english": "openai/whisper-small"
}
 
@lru_cache(maxsize=4)
def get_asr_pipeline(lang="hinglish"):
    """Load model based on selected language."""
    model_id = MODEL_MAP.get(lang, "Oriserve/Whisper-Hindi2Hinglish-Apex")
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model = AutoModelForSpeechSeq2Seq.from_pretrained(
        model_id,
        torch_dtype=torch_dtype,
        low_cpu_mem_usage=True,
        use_safetensors=True,
    ).to(device)

    processor = AutoProcessor.from_pretrained(model_id)

    generate_kwargs = {"task": "transcribe"}
    
    if lang == "hindi":
        generate_kwargs["language"] = "hi"
    elif lang == "marathi":
        generate_kwargs["language"] = "mr"
    elif lang == "english":
        generate_kwargs["language"] = "en"
    # Hinglish uses default (no specific language)

    asr = pipeline(
        "automatic-speech-recognition",
        model=model,
        tokenizer=processor.tokenizer,
        feature_extractor=processor.feature_extractor,
        torch_dtype=torch_dtype,
        device=device,
        generate_kwargs=generate_kwargs,
    )
    return asr


def transcribe_audio_to_segments(audio_path: str, language: str):
    """
    Transcribe audio with user-selected language.
    
    Args:
        audio_path: Path to audio file
        language: "hinglish", "hindi", "marathi", or "english" (REQUIRED)
    """
    print(f"[ASR] User selected language: {language}")
    
    # Get specialized model
    asr = get_asr_pipeline(language)

    # Transcribe with timestamps
    try:
        result = asr(audio_path, return_timestamps="chunk")
    except Exception as e:
        print(f"[ASR] Transcription error: {e}")
        return []

    segments = []
    for ch in result.get("chunks", []):
        start, end = ch["timestamp"]
        segments.append({
            "start": float(start or 0.0),
            "end": float(end or 0.0),
            "text": ch["text"].strip(),
            "language": language
        })

    # Fallback if no chunks
    if not segments and result.get("text"):
        segments.append({
            "start": 0.0,
            "end": 0.0,
            "text": result["text"].strip(),
            "language": language
        })
        
    print(f"[ASR] Transcription segments: {segments}")
    return segments


    