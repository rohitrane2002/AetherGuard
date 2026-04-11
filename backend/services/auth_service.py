from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, text
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import RefreshToken, User
from services.security_service import generate_secure_token, hash_token


bearer_scheme = HTTPBearer(auto_error=False)


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _parse_db_datetime(value) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return _as_utc(value)
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return _as_utc(parsed)


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_stateless_refresh_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": "refresh",
        "mode": "stateless",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=settings.refresh_token_expire_days)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


def create_refresh_token(user: User, db: Session) -> str:
    raw_token = generate_secure_token()
    expires_at = _utcnow_naive() + timedelta(days=settings.refresh_token_expire_days)
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=expires_at,
    )
    try:
        db.add(db_token)
        db.commit()
        return raw_token
    except Exception as exc:
        db.rollback()
        if isinstance(exc, (OperationalError, ProgrammingError)) or "refresh_tokens" in str(exc).lower():
            return create_stateless_refresh_token(user.email)
        raise


def revoke_refresh_token(raw_token: str, db: Session) -> None:
    try:
        payload = decode_token(raw_token)
        if payload.get("type") == "refresh" and payload.get("mode") == "stateless":
            return
    except HTTPException:
        pass

    token_hash = hash_token(raw_token)
    try:
        row = db.execute(
            text("SELECT id, revoked_at FROM refresh_tokens WHERE token_hash = :token_hash"),
            {"token_hash": token_hash},
        ).mappings().first()
        if row is not None and row["revoked_at"] is None:
            db.execute(
                text("UPDATE refresh_tokens SET revoked_at = :revoked_at WHERE id = :id"),
                {"revoked_at": _utcnow_naive(), "id": row["id"]},
            )
            db.commit()
    except Exception as exc:
        db.rollback()
        if isinstance(exc, (OperationalError, ProgrammingError)) or "refresh_tokens" in str(exc).lower():
            return
        raise


def get_user_from_refresh_token(raw_token: str, db: Session) -> User:
    try:
        payload = decode_token(raw_token)
        if payload.get("type") == "refresh" and payload.get("mode") == "stateless":
            email = payload.get("sub")
            user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if user is None or not user.is_active:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
            return user
    except HTTPException:
        pass

    token_hash = hash_token(raw_token)
    try:
        db_token = db.execute(
            text(
                "SELECT id, user_id, expires_at, revoked_at "
                "FROM refresh_tokens WHERE token_hash = :token_hash"
            ),
            {"token_hash": token_hash},
        ).mappings().first()
    except Exception as exc:
        db.rollback()
        if isinstance(exc, (OperationalError, ProgrammingError)) or "refresh_tokens" in str(exc).lower():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        raise
    if (
        db_token is None
        or db_token["revoked_at"] is not None
        or _parse_db_datetime(db_token["expires_at"]) <= datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.execute(select(User).where(User.id == db_token["user_id"])).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

    email = payload.get("sub")
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials is None:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
