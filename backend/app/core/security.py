from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings

ALGORITHM = "HS256"
# bcrypt only uses the first 72 bytes of a password.
BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:BCRYPT_MAX_BYTES], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    """Checks hashes written by the previous passlib setup too (same $2b$ bcrypt format)."""
    try:
        return bcrypt.checkpw(password.encode()[:BCRYPT_MAX_BYTES], password_hash.encode())
    except ValueError:
        return False


def create_access_token(subject: str, token_version: int = 0) -> str:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    now = datetime.now(UTC)
    payload = {"sub": subject, "exp": now + expires_delta, "iat": now, "ver": token_version}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
