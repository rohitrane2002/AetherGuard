from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_from_refresh_token,
    revoke_refresh_token,
    hash_password,
    verify_password,
)
from database import get_db
from models import Subscription, User
from schemas import (
    RefreshTokenRequest,
    TokenPairResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from services.workspace_service import ensure_personal_workspace, sync_pending_memberships_for_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(email=payload.email, password_hash=hash_password(payload.password), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)

    subscription = Subscription(user_id=user.id, plan="free", status="active")
    db.add(subscription)
    db.commit()
    sync_pending_memberships_for_user(db, user)
    ensure_personal_workspace(db, user)

    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user, db)
    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)

@router.post("/login", response_model=TokenPairResponse)
async def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    sync_pending_memberships_for_user(db, user)

    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user, db)
    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)

@router.post("/refresh", response_model=TokenPairResponse)
async def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    user = get_user_from_refresh_token(payload.refresh_token, db)
    revoke_refresh_token(payload.refresh_token, db)
    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user, db)
    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)

@router.post("/logout")
async def logout(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(payload.refresh_token, db)
    return {"success": True}

@router.get("/me", response_model=UserResponse)
async def auth_me(current_user: User = Depends(get_current_user)):
    return current_user
