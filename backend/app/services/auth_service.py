from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt, JWTError
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings

# Use PBKDF2 to avoid bcrypt's 72-byte password limit and backend issues on some Windows setups.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    expires = expires_minutes if expires_minutes is not None else settings.JWT_EXPIRES_MINUTES
    now = datetime.now(timezone.utc)
    payload = {
        **subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires)).timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as e:
        raise ValueError("Invalid or expired token") from e


def verify_google_id_token(credential: str) -> dict[str, Any]:
    """
    Verifies a Google ID token (credential) from Google Identity Services.
    Returns decoded claims (sub, email, name, picture, etc).
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured")
    try:
        return id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except Exception as e:
        raise ValueError("Invalid Google credential") from e


