import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config import settings

# In-memory token blocklist (for logout).
# In production, use Redis or a database table.
_blocklist: set[str] = set()


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises JWTError on failure."""
    payload = jwt.decode(
        token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
    )
    jti = payload.get("jti")
    if jti and jti in _blocklist:
        raise JWTError("Token has been revoked")
    return payload


def blocklist_token(token: str) -> None:
    """Add a token's JTI to the blocklist (logout)."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False},
        )
        jti = payload.get("jti")
        if jti:
            _blocklist.add(jti)
    except JWTError:
        pass
