from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_transcribe import router as transcribe_router

app = FastAPI(title="CaptionCraft API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe_router)


@app.get("/health")
def health():
    return {"status": "ok"}
