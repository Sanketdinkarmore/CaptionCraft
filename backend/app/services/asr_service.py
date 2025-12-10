import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from functools import lru_cache

MODEL_ID = "Oriserve/Whisper-Hindi2Hinglish-Apex"

@lru_cache(maxsize=1)
def get_asr_pipeline():
    """
    Load the Oriserve Whisper-Hindi2Hinglish model once and reuse it.
    """
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32

    model = AutoModelForSpeechSeq2Seq.from_pretrained(
        MODEL_ID,
        torch_dtype=torch_dtype,
        low_cpu_mem_usage=True,
        use_safetensors=True,
    ).to(device)

    processor = AutoProcessor.from_pretrained(MODEL_ID)

    asr = pipeline(
        "automatic-speech-recognition",
        model=model,
        tokenizer=processor.tokenizer,
        feature_extractor=processor.feature_extractor,
        torch_dtype=torch_dtype,
        device=device,
        generate_kwargs={
            "task": "transcribe",
            "language": "en",  # Hinglish output per model docs
        },
    )
    return asr

def transcribe_audio_to_segments(audio_path: str):
    """
    Run transcription on a .wav audio file and return a list of
    {start, end, text} suitable for subtitles.
    """
    asr = get_asr_pipeline()

    # ask pipeline to return timestamps in chunks
    result = asr(audio_path, return_timestamps="chunk")

    segments = []
    for ch in result.get("chunks", []):
        start, end = ch["timestamp"]
        segments.append(
            {
                "start": float(start),
                "end": float(end),
                "text": ch["text"].strip(),
            }
        )

    # fallback if chunks are missing
    if not segments:
        segments.append({"start": 0.0, "end": 0.0, "text": result["text"].strip()})

    return segments
