from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select, text
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
from billing import (
    create_checkout_session,
    extract_webhook_details,
    get_plan_from_price_id,
    parse_webhook,
    stripe_is_configured,
)
from config import settings
from db import get_db
from models import AnalysisLog, Subscription, User
from schemas import (
    AccountResponse,
    AnalysisHistoryResponse,
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyResponse,
    ChatRequest,
    ChatResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    HealthResponse,
    RefreshTokenRequest,
    TokenPairResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UsageResponse,
)
from services.analysis_service import run_analysis_and_log
from services.api_key_service import create_api_key_record, get_user_by_api_key, list_api_keys
from services.chat_service import chat_with_context
from services.rate_limit_service import rate_limiter
from services.security_service import snippet_from_code
from services.usage_service import get_user_usage, increment_usage


def build_router(get_analyzer, get_analyzer_init_error=lambda: None):
    router = APIRouter()

    def enforce_ip_rate_limit(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.allow(f"ip:{client_ip}", settings.ip_rate_limit_per_minute, 60):
            raise HTTPException(status_code=429, detail="Too many requests from this IP")

    def enforce_user_rate_limit(user: User) -> None:
        if not rate_limiter.allow(f"user:{user.id}", settings.user_rate_limit_per_minute, 60):
            raise HTTPException(status_code=429, detail="Too many requests for this user")

    @router.get("/health", response_model=HealthResponse)
    async def health_check(db: Session = Depends(get_db)):
        database_connected = True
        try:
            db.execute(text("SELECT 1"))
        except Exception:
            database_connected = False

        analyzer = get_analyzer()
        analyzer_init_error = get_analyzer_init_error()
        return HealthResponse(
            status="ok" if analyzer is not None and database_connected else "degraded",
            model={
                "ready": analyzer is not None,
                "source": analyzer.model_source if analyzer else None,
                "error": analyzer_init_error,
            },
            database={"connected": database_connected},
        )

    @router.post("/auth/register", response_model=TokenPairResponse, status_code=status.HTTP_201_CREATED)
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

        access_token = create_access_token(user.email)
        refresh_token = create_refresh_token(user, db)
        return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)

    @router.post("/auth/login", response_model=TokenPairResponse)
    async def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
        user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Inactive user")

        access_token = create_access_token(user.email)
        refresh_token = create_refresh_token(user, db)
        return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)

    @router.post("/auth/refresh", response_model=TokenPairResponse)
    async def refresh_tokens(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
        user = get_user_from_refresh_token(payload.refresh_token, db)
        revoke_refresh_token(payload.refresh_token, db)
        access_token = create_access_token(user.email)
        refresh_token = create_refresh_token(user, db)
        return TokenPairResponse(access_token=access_token, refresh_token=refresh_token, user=user)

    @router.post("/auth/logout")
    async def logout(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
        revoke_refresh_token(payload.refresh_token, db)
        return {"success": True}

    @router.get("/auth/me", response_model=UserResponse)
    async def auth_me(current_user: User = Depends(get_current_user)):
        return current_user

    @router.get("/account", response_model=AccountResponse)
    async def read_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        subscription = db.execute(
            select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
        ).scalar_one_or_none()
        return AccountResponse(
            id=current_user.id,
            email=current_user.email,
            is_active=current_user.is_active,
            subscription_plan=subscription.plan if subscription else current_user.subscription_plan,
            subscription_status=subscription.status if subscription else current_user.subscription_status,
            stripe_customer_id=subscription.stripe_customer_id if subscription else current_user.stripe_customer_id,
            created_at=current_user.created_at,
        )

    @router.get("/usage", response_model=UsageResponse)
    async def read_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return UsageResponse(**get_user_usage(db, current_user))

    @router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
    async def create_checkout(payload: CheckoutSessionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        session = create_checkout_session(payload.price_id, current_user.email)
        subscription = db.execute(
            select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
        ).scalar_one_or_none()
        if subscription is None:
            subscription = Subscription(user_id=current_user.id)
        subscription.plan = session["plan"]
        subscription.status = "checkout_created"
        subscription.stripe_customer_id = session["customer_id"]
        subscription.stripe_price_id = session["price_id"]
        subscription.stripe_subscription_id = session["subscription_id"]
        current_user.subscription_plan = session["plan"]
        current_user.subscription_status = "checkout_created"
        current_user.stripe_customer_id = session["customer_id"]
        db.add(subscription)
        db.add(current_user)
        db.commit()
        return CheckoutSessionResponse(
            sessionId=session["session_id"],
            customerId=session["customer_id"],
            priceId=session["price_id"],
            plan=session["plan"],
            customerEmail=session["customer_email"],
            createdAt=session["created_at"],
            checkoutUrl=session["checkout_url"],
            mode=session["mode"],
        )

    @router.post("/webhook/stripe")
    async def stripe_webhook(
        request: Request,
        stripe_signature: Optional[str] = Header(default=None, alias="Stripe-Signature"),
        db: Session = Depends(get_db),
    ):
        raw_body = await request.body()
        if stripe_is_configured() and settings.stripe_webhook_secret:
            event = parse_webhook(raw_body, stripe_signature)
            details = extract_webhook_details(event)
            if not details["supported"]:
                return {"received": True, "ignored": True, "event_type": details["event_type"]}
            customer_email = details["customer_email"]
            price_id = details["price_id"]
            stripe_customer_id = details["customer_id"]
            stripe_subscription_id = details["subscription_id"]
            status_value = details["status"]
            current_period_end = details["current_period_end"]
            plan = details["plan"]
        else:
            payload = await request.json()
            customer_email = payload.get("customer_email")
            price_id = payload.get("price_id")
            stripe_customer_id = payload.get("customer_id")
            stripe_subscription_id = payload.get("subscription_id")
            status_value = payload.get("status", "active")
            current_period_end = None
            plan = "free" if status_value == "cancelled" else get_plan_from_price_id(price_id)

        user = None
        if customer_email:
            user = db.execute(select(User).where(User.email == customer_email)).scalar_one_or_none()
        if user is None and stripe_customer_id:
            user = db.execute(select(User).where(User.stripe_customer_id == stripe_customer_id)).scalar_one_or_none()
        if user is None and stripe_customer_id:
            subscription_user = db.execute(
                select(Subscription).where(Subscription.stripe_customer_id == stripe_customer_id).order_by(Subscription.id.desc())
            ).scalar_one_or_none()
            if subscription_user is not None:
                user = db.execute(select(User).where(User.id == subscription_user.user_id)).scalar_one_or_none()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found for Stripe event")

        subscription = db.execute(
            select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.id.desc())
        ).scalar_one_or_none()
        if subscription is None:
            subscription = Subscription(user_id=user.id)

        subscription.plan = plan
        subscription.status = status_value
        subscription.stripe_customer_id = stripe_customer_id or subscription.stripe_customer_id
        subscription.stripe_subscription_id = stripe_subscription_id or subscription.stripe_subscription_id
        subscription.stripe_price_id = price_id or subscription.stripe_price_id
        subscription.current_period_end = current_period_end
        user.subscription_plan = plan
        user.subscription_status = status_value
        user.stripe_customer_id = stripe_customer_id or user.stripe_customer_id
        db.add(subscription)
        db.add(user)
        db.commit()
        return {"received": True, "email": user.email, "plan": plan, "status": status_value}

    @router.post("/analyze/")
    async def analyze_contract(
        payload: dict,
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        enforce_ip_rate_limit(request)
        enforce_user_rate_limit(current_user)
        source = payload.get("content", "")
        if not source.strip():
            raise HTTPException(status_code=400, detail="Contract source is required")
        if len(source) > settings.max_solidity_chars:
            raise HTTPException(status_code=413, detail="Solidity input exceeds maximum allowed size")

        usage = get_user_usage(db, current_user)
        if usage["remaining_today"] <= 0:
            raise HTTPException(status_code=403, detail=f"Daily analysis limit reached for the {current_user.subscription_plan} plan")

        analyzer = get_analyzer()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Analyzer is not ready")

        result = run_analysis_and_log(db, analyzer, current_user, source)
        usage_after = increment_usage(db, current_user)
        result["remaining_today"] = usage_after["remaining_today"]
        return result

    @router.get("/history", response_model=list[AnalysisHistoryResponse])
    async def history(limit: int = Query(default=20, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        logs = db.execute(
            select(AnalysisLog).where(AnalysisLog.user_id == current_user.id).order_by(AnalysisLog.id.desc()).limit(limit)
        ).scalars().all()
        return [
            AnalysisHistoryResponse(
                id=log.id,
                contract_snippet=snippet_from_code(log.source_code),
                prediction=log.prediction,
                confidence=log.confidence,
                timestamp=log.created_at,
            )
            for log in logs
        ]

    @router.get("/analyses", response_model=list[AnalysisHistoryResponse])
    async def analyses_alias(limit: int = Query(default=20, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return await history(limit, current_user, db)

    @router.post("/chat", response_model=ChatResponse)
    async def chat(payload: ChatRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        enforce_ip_rate_limit(request)
        enforce_user_rate_limit(current_user)
        return ChatResponse(**(await chat_with_context(db, current_user, payload.message)))

    @router.post("/api-keys", response_model=ApiKeyCreateResponse)
    async def create_api_key(payload: ApiKeyCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        record, raw_key = create_api_key_record(db, current_user, payload.name)
        return ApiKeyCreateResponse(
            id=record.id,
            name=record.name,
            key=raw_key,
            key_prefix=record.key_prefix,
            created_at=record.created_at,
        )

    @router.get("/api-keys", response_model=list[ApiKeyResponse])
    async def get_api_keys(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return list_api_keys(db, current_user)

    @router.post("/api/analyze")
    async def api_key_analyze(
        payload: dict,
        request: Request,
        x_api_key: str = Header(..., alias="X-API-Key"),
        db: Session = Depends(get_db),
    ):
        enforce_ip_rate_limit(request)
        if not rate_limiter.allow(f"api_key:{x_api_key[:12]}", settings.api_key_rate_limit_per_minute, 60):
            raise HTTPException(status_code=429, detail="API key rate limit exceeded")

        _, user = get_user_by_api_key(x_api_key, db)
        source = payload.get("content", "")
        if not source.strip():
            raise HTTPException(status_code=400, detail="Contract source is required")
        if len(source) > settings.max_solidity_chars:
            raise HTTPException(status_code=413, detail="Solidity input exceeds maximum allowed size")
        usage = get_user_usage(db, user)
        if usage["remaining_today"] <= 0:
            raise HTTPException(status_code=403, detail=f"Daily analysis limit reached for the {user.subscription_plan} plan")

        analyzer = get_analyzer()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Analyzer is not ready")
        result = run_analysis_and_log(db, analyzer, user, source)
        usage_after = increment_usage(db, user)
        result["remaining_today"] = usage_after["remaining_today"]
        return result

    @router.get("/predict/failure")
    async def protected_failure_example(current_user: User = Depends(get_current_user)):
        return {"ok": True, "user": current_user.email}

    return router
