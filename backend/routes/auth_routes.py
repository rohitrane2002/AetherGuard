import uuid
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_from_refresh_token,
    hash_password,
    verify_password,
)
from services.security_service import encrypt_secret
from config import settings
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
from services.rate_limit_service import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


# ─── Email/Password Auth ─────────────────────────────────────────────

@router.post("/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_user(request: Request, payload: UserRegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(email=payload.email, password_hash=hash_password(payload.password), is_active=True, provider="email")
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
@limiter.limit("5/minute")
async def login_user(request: Request, payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if user is None or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")
    sync_pending_memberships_for_user(db, user)

    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user, db)
    return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=TokenPairResponse)
@limiter.limit("10/minute")
async def refresh_tokens(request: Request, payload: RefreshTokenRequest, db: Session = Depends(get_db)):
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


# ─── Helper: upsert OAuth user ──────────────────────────────────────

def _upsert_oauth_user(
    db: Session,
    *,
    email: str,
    provider: str,
    avatar_url: str | None = None,
    github_username: str | None = None,
    github_access_token: str | None = None,
) -> User:
    """Find or create a user from an OAuth provider."""
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    if user is None:
        user = User(
            id=uuid.uuid4(),
            email=email,
            password_hash=None,
            is_active=True,
            provider=provider,
            avatar_url=avatar_url,
            github_username=github_username,
            github_access_token=encrypt_secret(github_access_token) if github_access_token else None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        subscription = Subscription(user_id=user.id, plan="free", status="active")
        db.add(subscription)
        db.commit()
        sync_pending_memberships_for_user(db, user)
        ensure_personal_workspace(db, user)
    else:
        # Update existing user with latest OAuth data
        if avatar_url:
            user.avatar_url = avatar_url
        if github_username:
            user.github_username = github_username
        if github_access_token:
            user.github_access_token = encrypt_secret(github_access_token)
        if user.provider == "email":
            user.provider = provider
        db.commit()

    return user


def _build_frontend_redirect(access_token: str, refresh_token: str, email: str, provider: str) -> str:
    """Build the frontend callback URL with tokens as query params."""
    params = urlencode({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "email": email,
        "provider": provider,
    })
    return f"{settings.frontend_url}/auth/callback?{params}"


# ─── Google OAuth ────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/oauth/google")
async def google_oauth_redirect():
    """Redirect user to Google's consent screen."""
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")

    params = urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.backend_url}/auth/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    })
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/oauth/google/callback")
async def google_oauth_callback(code: str, db: Session = Depends(get_db)):
    """Exchange Google auth code for tokens, create/find user, redirect to frontend."""
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_resp = await client.post(GOOGLE_TOKEN_URL, data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": f"{settings.backend_url}/auth/oauth/google/callback",
                "grant_type": "authorization_code",
            })
            token_resp.raise_for_status()
            token_data = token_resp.json()

            # Fetch user profile
            userinfo_resp = await client.get(GOOGLE_USERINFO_URL, headers={
                "Authorization": f"Bearer {token_data['access_token']}",
            })
            userinfo_resp.raise_for_status()
            userinfo = userinfo_resp.json()

        email = userinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email in Google profile")

        user = _upsert_oauth_user(
            db,
            email=email,
            provider="google",
            avatar_url=userinfo.get("picture"),
        )

        access_token = create_access_token(user.email)
        refresh_token = create_refresh_token(user, db)
        redirect_url = _build_frontend_redirect(access_token, refresh_token, user.email, "google")
        return RedirectResponse(url=redirect_url)

    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Google OAuth error: {exc.response.text}")


# ─── GitHub OAuth ────────────────────────────────────────────────────

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/oauth/github")
async def github_oauth_redirect():
    """Redirect user to GitHub's consent screen."""
    if not settings.github_client_id:
        raise HTTPException(status_code=503, detail="GitHub OAuth not configured")

    params = urlencode({
        "client_id": settings.github_client_id,
        "redirect_uri": f"{settings.backend_url}/auth/oauth/github/callback",
        "scope": "read:user user:email repo",
    })
    return RedirectResponse(url=f"{GITHUB_AUTH_URL}?{params}")


@router.get("/oauth/github/callback")
async def github_oauth_callback(code: str, db: Session = Depends(get_db)):
    """Exchange GitHub auth code for tokens, create/find user, redirect to frontend."""
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_resp = await client.post(
                GITHUB_TOKEN_URL,
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": f"{settings.backend_url}/auth/oauth/github/callback",
                },
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()

            gh_access_token = token_data.get("access_token")
            if not gh_access_token:
                raise HTTPException(status_code=400, detail="No access token from GitHub")

            # Fetch user profile
            user_resp = await client.get(GITHUB_USER_URL, headers={
                "Authorization": f"Bearer {gh_access_token}",
                "Accept": "application/vnd.github+json",
            })
            user_resp.raise_for_status()
            gh_user = user_resp.json()

            # Fetch emails (the profile email can be null if private)
            email = gh_user.get("email")
            if not email:
                emails_resp = await client.get(GITHUB_EMAILS_URL, headers={
                    "Authorization": f"Bearer {gh_access_token}",
                    "Accept": "application/vnd.github+json",
                })
                emails_resp.raise_for_status()
                emails = emails_resp.json()
                primary = next((e for e in emails if e.get("primary")), None)
                email = primary["email"] if primary else emails[0]["email"] if emails else None

            if not email:
                raise HTTPException(status_code=400, detail="No email found on GitHub account")

        user = _upsert_oauth_user(
            db,
            email=email,
            provider="github",
            avatar_url=gh_user.get("avatar_url"),
            github_username=gh_user.get("login"),
            github_access_token=gh_access_token,
        )

        access_token = create_access_token(user.email)
        refresh_token = create_refresh_token(user, db)
        redirect_url = _build_frontend_redirect(access_token, refresh_token, user.email, "github")
        return RedirectResponse(url=redirect_url)

    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"GitHub OAuth error: {exc.response.text}")
