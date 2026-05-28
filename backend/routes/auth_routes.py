import uuid
from urllib.parse import urlencode
from typing import Optional

import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_from_refresh_token,
    hash_password,
    verify_password,
    revoke_refresh_token,
)
from services.security_service import encrypt_secret
from config import settings
from database import get_db
from models import Subscription, User
from utils.email_utils import is_disposable_email
from services.otp_service import create_otp_for_user, verify_otp_for_user, send_otp_email
from schemas import (
    OtpVerifyRequest,
    RefreshTokenRequest,
    TokenPairResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from services.workspace_service import ensure_personal_workspace, sync_pending_memberships_for_user
from services.rate_limit_service import limiter

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _is_schema_drift_error(exc: Exception) -> bool:
    if isinstance(exc, (OperationalError, ProgrammingError)):
        return True
    message = str(exc).lower()
    markers = (
        "does not exist",
        "undefined table",
        "undefined column",
        "no such table",
        "no such column",
        "relation ",
        "column ",
    )
    return any(marker in message for marker in markers)


def _ensure_free_subscription(db: Session, user: User) -> None:
    try:
        existing = db.execute(select(Subscription).where(Subscription.user_id == user.id)).scalar_one_or_none()
        if existing is None:
            db.add(Subscription(user_id=user.id, plan="free", status="active"))
            db.commit()
    except Exception as exc:
        db.rollback()
        if not _is_schema_drift_error(exc):
            raise


def _ensure_workspace_bootstrap(db: Session, user: User) -> None:
    try:
        sync_pending_memberships_for_user(db, user)
        ensure_personal_workspace(db, user)
    except Exception as exc:
        db.rollback()
        if not _is_schema_drift_error(exc):
            raise


def _token_pair_response(user: User, db: Session) -> TokenPairResponse:
    access_token = create_access_token(user.email)
    refresh_token = create_refresh_token(user, db)
    created_at = getattr(user, "created_at", None)
    if created_at is None:
        from datetime import datetime, timezone

        created_at = datetime.now(timezone.utc)

    return TokenPairResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            is_active=bool(getattr(user, "is_active", True)),
            provider=getattr(user, "provider", "email") or "email",
            avatar_url=getattr(user, "avatar_url", None),
            created_at=created_at,
        ),
    )


# ─── Email/Password Auth ─────────────────────────────────────────────

@router.post("/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_user(request: Request, payload: UserRegisterRequest, db: Session = Depends(get_db)):
    try:
        # Check for disposable emails
        if is_disposable_email(payload.email):
            raise HTTPException(status_code=400, detail="Disposable emails are not allowed")

        existing_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
        if existing_user is not None:
            raise HTTPException(status_code=409, detail="User already exists")

        user = User(
            email=payload.email, 
            password_hash=hash_password(payload.password), 
            is_active=True, 
            provider="email",
            is_email_verified=False # New users must verify
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Generate and "send" OTP
        otp = create_otp_for_user(db, user)
        send_otp_email(user.email, otp)

        _ensure_free_subscription(db, user)
        _ensure_workspace_bootstrap(db, user)

        return _token_pair_response(user, db)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Auth register failed for %s", payload.email)
        raise HTTPException(status_code=500, detail=f"AUTH_REGISTER_CRASH: {type(exc).__name__}: {exc}") from exc


@router.post("/login", response_model=TokenPairResponse)
@limiter.limit("5/minute")
async def login_user(request: Request, payload: UserLoginRequest, db: Session = Depends(get_db)):
    try:
        user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
        if user is None or not user.password_hash or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Inactive user")
        
        # Check if email is verified for email-password users
        if user.provider == "email" and not user.is_email_verified:
            # Resend OTP if they try to login but aren't verified
            otp = create_otp_for_user(db, user)
            send_otp_email(user.email, otp)
            raise HTTPException(status_code=403, detail="EMAIL_NOT_VERIFIED")

        _ensure_workspace_bootstrap(db, user)

        return _token_pair_response(user, db)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Auth login failed for %s", payload.email)
        raise HTTPException(status_code=500, detail=f"AUTH_LOGIN_CRASH: {type(exc).__name__}: {exc}") from exc


@router.post("/verify-otp")
async def verify_otp(payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    try:
        user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        if verify_otp_for_user(db, user, payload.code):
            return {"message": "Email verified successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("OTP verification failed for %s", payload.email)
        raise HTTPException(status_code=500, detail=f"OTP_VERIFY_CRASH: {exc}") from exc


@router.post("/resend-otp")
async def resend_otp(email: str, db: Session = Depends(get_db)):
    try:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.is_email_verified:
            return {"message": "Email already verified"}
            
        otp = create_otp_for_user(db, user)
        send_otp_email(user.email, otp)
        return {"message": "OTP sent successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("OTP resend failed for %s", email)
        raise HTTPException(status_code=500, detail=f"OTP_RESEND_CRASH: {exc}") from exc


@router.post("/refresh", response_model=TokenPairResponse)
@limiter.limit("10/minute")
async def refresh_tokens(request: Request, payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    try:
        user = get_user_from_refresh_token(payload.refresh_token, db)
        revoke_refresh_token(payload.refresh_token, db)
        return _token_pair_response(user, db)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Refresh token exchange failed")
        raise HTTPException(status_code=500, detail=f"AUTH_REFRESH_CRASH: {type(exc).__name__}: {exc}") from exc


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
    avatar_url: Optional[str] = None,
    github_username: Optional[str] = None,
    github_access_token: Optional[str] = None,
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

        _ensure_free_subscription(db, user)
        _ensure_workspace_bootstrap(db, user)
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
        _ensure_workspace_bootstrap(db, user)

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
    except Exception as exc:
        logger.exception("Google OAuth callback failed")
        raise HTTPException(status_code=500, detail=f"GOOGLE_OAUTH_CRASH: {type(exc).__name__}: {exc}") from exc


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
    except Exception as exc:
        logger.exception("GitHub OAuth callback failed")
        raise HTTPException(status_code=500, detail=f"GITHUB_OAUTH_CRASH: {type(exc).__name__}: {exc}") from exc
