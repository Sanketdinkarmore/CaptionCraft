from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_transcribe import router as transcribe_router
from app.api.routes_render import router as render_router

app = FastAPI(title="CaptionCraft API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe_router, prefix="/api")
app.include_router(render_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
