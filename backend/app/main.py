from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes_transcribe import router as transcribe_router
from app.api.routes_render import router as render_router
from app.api.routes_projects import router as projects_router
from app.api.routes_auth import router as auth_router
from app.api.routes_upload import router as upload_router
from app.database.connection import connect_to_mongo, close_mongo_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await connect_to_mongo()
    yield
    # Shutdown: Close MongoDB connection
    await close_mongo_connection()


app = FastAPI(title="CaptionCraft API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe_router, prefix="/api")
app.include_router(render_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(upload_router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
