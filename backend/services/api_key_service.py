from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from db import get_db
from models import ApiKey, User
from services.security_service import build_api_key, hash_token


def create_api_key_record(db: Session, user: User, name: str) -> tuple[ApiKey, str]:
    raw_key, key_hash, key_prefix = build_api_key()
    record = ApiKey(
        user_id=user.id,
        name=name,
        key_hash=key_hash,
        key_prefix=key_prefix,
        is_active=True,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record, raw_key


def get_user_by_api_key(raw_key: str, db: Session) -> tuple[ApiKey, User]:
    key_hash = hash_token(raw_key)
    api_key = db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active == True)).scalar_one_or_none()
    if api_key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")

    user = db.execute(select(User).where(User.id == api_key.user_id, User.is_active == True)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive API key owner")

    api_key.last_used_at = datetime.now(timezone.utc)
    db.add(api_key)
    db.commit()
    return api_key, user


def list_api_keys(db: Session, user: User) -> list[ApiKey]:
    return db.execute(select(ApiKey).where(ApiKey.user_id == user.id).order_by(ApiKey.id.desc())).scalars().all()
