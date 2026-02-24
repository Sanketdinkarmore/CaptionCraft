from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage

from app.config import settings


def _smtp_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD and settings.EMAIL_FROM)


def _send_email_sync(*, to_email: str, subject: str, text_body: str) -> None:
    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(text_body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        if settings.SMTP_USE_TLS:
            server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(msg)


async def send_password_reset_email(*, to_email: str, reset_link: str) -> None:
    """
    Sends a password reset email. If SMTP isn't configured, logs the link to console (dev mode).
    """
    subject = "Reset your CaptionCraft password"
    text_body = (
        "We received a request to reset your CaptionCraft password.\n\n"
        f"Reset link:\n{reset_link}\n\n"
        "If you didn't request this, you can ignore this email.\n"
    )

    if not _smtp_configured():
        # Dev fallback: print link so you can click/copy it.
        print(f"[DEV] Password reset email to {to_email}: {reset_link}")
        return

    await asyncio.to_thread(_send_email_sync, to_email=to_email, subject=subject, text_body=text_body)

