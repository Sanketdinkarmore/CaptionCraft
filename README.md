# CaptionCraft

CaptionCraft is an AI-powered subtitle and transcription web application for creators.  
It lets users upload video/audio, generate timestamped captions with ASR, edit subtitles, share projects using tokenized links, and export outputs.

## Features

- User authentication (signup, login, Google login, password reset)
- Media upload with thumbnail generation
- AI transcription with language selection:
  - Hinglish
  - Hindi
  - Marathi
  - English
- Segment-based subtitle editing (text + timing + style)
- Project save/load/delete
- Shareable public links using share tokens
- SRT download and rendered video export
- Collections support for organizing projects

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- FastAPI (Python)
- MongoDB Atlas
- Cloudinary (media storage)
- Transformers + PyTorch (ASR)
- FFmpeg (audio extraction and video rendering)

## Project Structure

```text
CaptionCraft/
  frontend/                  # Next.js app
    app/
      editor/
      login/
      signup/
      shared/[token]/
    lib/
      apiClient.ts
      authClient.ts

  backend/                   # FastAPI app
    app/
      api/
        routes_auth.py
        routes_upload.py
        routes_transcribe.py
        routes_projects.py
        routes_render.py
        routes_collections.py
      services/
        asr_service.py
        storage_service.py
        project_service.py
      database/
        connection.py
        models.py
      main.py
```

## System Flow

1. User signs up / logs in.
2. User uploads video/audio.
3. Backend extracts audio and runs ASR with selected language.
4. Timestamped segments are returned to frontend editor.
5. User edits text/timing/styles and saves project.
6. User can generate share token and share link.
7. User exports SRT or rendered captioned video.

## Prerequisites

Install these before local setup:

- Node.js 18+ and npm
- Python 3.10+ (recommended)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- FFmpeg installed and available in PATH

Check FFmpeg:

```bash
ffmpeg -version
```

## Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=captioncraft

JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRES_MINUTES=43200

RESET_PASSWORD_SECRET_KEY=your_reset_secret
RESET_PASSWORD_EXPIRES_MINUTES=30

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

FRONTEND_BASE_URL=http://localhost:3000

SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=true
EMAIL_FROM=noreply@captioncraft.local

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=

ENVIRONMENT=development
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
```

## Run Locally

### 1) Backend setup

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install fastapi uvicorn python-dotenv motor pymongo python-multipart pydantic[email] passlib[bcrypt] python-jose[cryptography] cloudinary requests fonttools transformers torch google-auth
```

Start backend server:

```bash
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`  
Health check: `http://localhost:8000/health`

### 2) Frontend setup

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

## API Overview

Base prefix: `/api`

- Auth:
  - `POST /auth/signup`
  - `POST /auth/login`
  - `POST /auth/google`
  - `GET /auth/me`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
- Upload:
  - `POST /upload/video`
  - `POST /upload/thumbnail`
- Transcription:
  - `POST /transcribe`
- Projects:
  - `POST /projects`
  - `GET /projects`
  - `GET /projects/{id}`
  - `PUT /projects/{id}`
  - `DELETE /projects/{id}`
  - `POST /projects/{id}/share`
  - `DELETE /projects/{id}/share`
  - `GET /shared/{share_token}`
- Render:
  - `POST /render`
  - `GET /render/download/{file_name}`
- Collections:
  - collection CRUD endpoints under `/collections`

## Notes

- GPU is optional. If CUDA is available, ASR uses GPU automatically.
- First ASR run may take time due to model download/loading.
- Keep secrets in `.env` files; do not commit them.

## License

Use an appropriate license for your college/project submission.

