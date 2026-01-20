from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    verify_google_id_token,
)
from app.services.user_service import (
    get_user_by_email,
    get_user_by_id,
    get_user_by_google_id,
    create_user,
)


router = APIRouter(tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token from Google Identity Services


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/auth/signup", response_model=AuthResponse)
async def signup(body: SignupRequest):
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    pw_hash = hash_password(body.password)
    user = await create_user(email=body.email, name=body.name, password_hash=pw_hash)
    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "name": user.name},
    }


@router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    user = await get_user_by_email(body.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "name": user.name},
    }


@router.post("/auth/google", response_model=AuthResponse)
async def google_login(body: GoogleLoginRequest):
    claims = verify_google_id_token(body.credential)
    google_id = claims.get("sub")
    email = claims.get("email")
    name = claims.get("name") or (email.split("@")[0] if email else "Google User")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Google token missing required fields")

    user = await get_user_by_google_id(google_id)
    if not user:
        # If email exists, link it; else create
        user_by_email = await get_user_by_email(email)
        if user_by_email:
            # Link google id to existing user
            from app.services.user_service import update_user_google_link

            await update_user_google_link(user_by_email.id, google_id)
            user = await get_user_by_google_id(google_id)
        else:
            # Create user with random unusable password hash (still required by model)
            user = await create_user(email=email, name=name, password_hash=hash_password(google_id), google_id=google_id)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "name": user.name},
    }


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "name": user.name}


