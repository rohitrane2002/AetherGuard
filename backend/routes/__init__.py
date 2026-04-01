from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
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
    create_billing_portal_session,
    create_checkout_session,
    extract_webhook_details,
    get_plan_from_price_id,
    parse_webhook,
    stripe_is_configured,
)
from config import settings
from database import get_db
from models import AnalysisLog, SharedReport, Subscription, TeamMembership, User
from routes.auth_routes import router as auth_router
from schemas import (
    AccountResponse,
    ApiKeyCreateRequest,
    ApiKeyCreateResponse,
    ApiKeyResponse,
    AnalysisHistoryResponse,
    AnalysisResponse,
    BillingPortalResponse,
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    DashboardSummaryResponse,
    FixContractRequest,
    FixContractResponse,
    HealthResponse,
    NotificationResponse,
    RefreshTokenRequest,
    ShareReportRequest,
    TokenPairResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UsageResponse,
    WorkspaceInviteRequest,
    WorkspaceInviteResponse,
    WorkspaceMemberUpdateRequest,
    WorkspaceResponse,
)
from services.analysis_service import run_analysis_and_log
from services.api_key_service import create_api_key_record, get_user_by_api_key, list_api_keys
from services.chat_service import chat_with_context, get_chat_history, stream_chat_with_context
from services.notification_service import (
    create_notification,
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    notification_metrics,
)
from services.rate_limit_service import rate_limiter
from services.security_service import (
    build_analysis_summary,
    build_autofix_preview,
    build_fix_suggestions,
    compute_confidence,
    compute_risk_score,
    generate_fixed_contract,
    infer_safe_patterns,
    infer_vulnerability_findings,
    snippet_from_code,
)
from services.usage_service import get_user_usage, increment_usage
from services.workspace_service import (
    build_workspace_payload,
    can_manage_workspace,
    ensure_personal_workspace,
    get_workspace_membership,
    sync_pending_memberships_for_user,
    workspace_counts,
)


def build_router(get_analyzer, get_analyzer_init_error=lambda: None):
    router = APIRouter()
    router.include_router(auth_router)

    def preview_analysis(analyzer, source: str) -> dict:
        result = analyzer.predict(source)
        findings = infer_vulnerability_findings(source)
        safe_patterns = infer_safe_patterns(source)
        risk_score = compute_risk_score(result["prediction"], result["prob_vulnerable"], findings)
        confidence = compute_confidence(result["prob_secure"], result["prob_vulnerable"])
        return {
            **result,
            "email": "preview@aetherguard.local",
            "log_id": 0,
            "confidence": confidence,
            "remaining_today": 0,
            "risk_score": risk_score,
            "findings": findings,
            "safe_patterns": safe_patterns,
            "summary": build_analysis_summary(result["prediction"], risk_score, findings, safe_patterns),
            "fix_suggestions": build_fix_suggestions(findings),
            "autofix_preview": build_autofix_preview(findings, safe_patterns),
        }

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

    @router.get("/debug/test")
    async def debug_test(current_user: User = Depends(get_current_user)):
        return {"status": "REACHED", "user": current_user.email}

    @router.get("/dashboard/summary")
    async def dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        from fastapi.encoders import jsonable_encoder
        return jsonable_encoder({"status": "OK", "debug_user": current_user.email})

    @router.get("/account", response_model=AccountResponse)
    async def read_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        subscription = db.execute(
            select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
        ).scalar_one_or_none()
        return AccountResponse(
            id=current_user.id,
            email=current_user.email,
            is_active=current_user.is_active,
            plan=subscription.plan if subscription else current_user.plan,
            subscription_status=subscription.status if subscription else current_user.subscription_status,
            stripe_customer_id=subscription.stripe_customer_id if subscription else current_user.stripe_customer_id,
            created_at=current_user.created_at,
        )

    @router.get("/usage", response_model=UsageResponse)
    async def read_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return UsageResponse(**get_user_usage(db, current_user))

    @router.get("/workspace", response_model=WorkspaceResponse)
    async def read_workspace(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return WorkspaceResponse(**build_workspace_payload(db, current_user))

    @router.post("/workspace/invitations", response_model=WorkspaceInviteResponse, status_code=status.HTTP_201_CREATED)
    async def invite_workspace_member(
        payload: WorkspaceInviteRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        team, membership = get_workspace_membership(db, current_user)
        if not can_manage_workspace(membership):
            raise HTTPException(status_code=403, detail="Only owners and admins can invite members")

        existing = db.execute(
            select(TeamMembership).where(
                TeamMembership.team_id == team.id,
                TeamMembership.invited_email == payload.email,
            )
        ).scalar_one_or_none()
        if existing is not None:
            raise HTTPException(status_code=409, detail="Invitation already exists for this email")

        membership_record = TeamMembership(
            team_id=team.id,
            invited_email=payload.email,
            role=payload.role,
            status="invited",
        )
        invited_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
        if invited_user is not None:
            membership_record.user_id = invited_user.id
            membership_record.status = "active"

        db.add(membership_record)
        db.commit()
        db.refresh(membership_record)
        if invited_user is not None:
            create_notification(
                db,
                user_id=invited_user.id,
                title="Added to shared workspace",
                body=f"You were added to {team.name} as {membership_record.role}.",
                severity="info",
                category="workspace",
                action_url="/workspace",
                source_type="team_membership",
                source_id=membership_record.id,
            )
        return WorkspaceInviteResponse(
            invitation_id=membership_record.id,
            email=payload.email,
            role=membership_record.role,
            status=membership_record.status,
        )

    @router.patch("/workspace/members/{membership_id}")
    async def update_workspace_member(
        membership_id: int,
        payload: WorkspaceMemberUpdateRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        team, current_membership = get_workspace_membership(db, current_user)
        if not can_manage_workspace(current_membership):
            raise HTTPException(status_code=403, detail="Only owners and admins can manage members")

        membership_record = db.execute(
            select(TeamMembership).where(
                TeamMembership.id == membership_id,
                TeamMembership.team_id == team.id,
            )
        ).scalar_one_or_none()
        if membership_record is None:
            raise HTTPException(status_code=404, detail="Workspace member not found")
        if membership_record.role == "owner":
            raise HTTPException(status_code=400, detail="Owner role cannot be changed")
        membership_record.role = payload.role
        db.add(membership_record)
        db.commit()
        return {"updated": True, "membership_id": membership_record.id, "role": membership_record.role}

    @router.delete("/workspace/members/{membership_id}")
    async def remove_workspace_member(
        membership_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        team, current_membership = get_workspace_membership(db, current_user)
        if not can_manage_workspace(current_membership):
            raise HTTPException(status_code=403, detail="Only owners and admins can manage members")

        membership_record = db.execute(
            select(TeamMembership).where(
                TeamMembership.id == membership_id,
                TeamMembership.team_id == team.id,
            )
        ).scalar_one_or_none()
        if membership_record is None:
            raise HTTPException(status_code=404, detail="Workspace member not found")
        if membership_record.role == "owner":
            raise HTTPException(status_code=400, detail="Owner cannot be removed")
        db.delete(membership_record)
        db.commit()
        return {"removed": True, "membership_id": membership_id}

    @router.post("/workspace/share-report")
    async def share_report_to_workspace(
        payload: ShareReportRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        team, _ = ensure_personal_workspace(db, current_user)
        analysis = db.execute(
            select(AnalysisLog).where(
                AnalysisLog.id == payload.analysis_log_id,
                AnalysisLog.user_id == current_user.id,
            )
        ).scalar_one_or_none()
        if analysis is None:
            raise HTTPException(status_code=404, detail="Analysis not found")

        existing_share = db.execute(
            select(SharedReport).where(
                SharedReport.team_id == team.id,
                SharedReport.analysis_log_id == analysis.id,
            )
        ).scalar_one_or_none()
        if existing_share is not None:
            return {"shared": True, "report_id": existing_share.id, "already_shared": True}

        shared_report = SharedReport(
            team_id=team.id,
            analysis_log_id=analysis.id,
            shared_by_user_id=current_user.id,
        )
        db.add(shared_report)
        db.commit()
        db.refresh(shared_report)
        create_notification(
            db,
            user_id=current_user.id,
            title="Report published to workspace",
            body="Your latest audit has been added to the shared workspace stream.",
            severity="info",
            category="workspace",
            action_url="/reports",
            source_type="shared_report",
            source_id=shared_report.id,
        )
        return {"shared": True, "report_id": shared_report.id, "already_shared": False}

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
        current_user.plan = session["plan"]
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

    @router.post("/create-billing-portal-session", response_model=BillingPortalResponse)
    async def create_billing_portal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        subscription = db.execute(
            select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
        ).scalar_one_or_none()
        customer_id = None
        if subscription and subscription.stripe_customer_id:
            customer_id = subscription.stripe_customer_id
        elif current_user.stripe_customer_id:
            customer_id = current_user.stripe_customer_id

        session = create_billing_portal_session(customer_id, current_user.email)

        if session["customer_id"] and session["customer_id"] != current_user.stripe_customer_id:
            current_user.stripe_customer_id = session["customer_id"]
            db.add(current_user)
            if subscription is not None and subscription.stripe_customer_id != session["customer_id"]:
                subscription.stripe_customer_id = session["customer_id"]
                db.add(subscription)
            db.commit()

        return BillingPortalResponse(
            portalUrl=session["portal_url"],
            customerId=session["customer_id"],
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
        user.plan = plan
        user.subscription_status = status_value
        user.stripe_customer_id = stripe_customer_id or user.stripe_customer_id
        db.add(subscription)
        db.add(user)
        db.commit()
        return {"received": True, "email": user.email, "plan": plan, "status": status_value}

    @router.post("/analyze/", response_model=AnalysisResponse)
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
            raise HTTPException(status_code=403, detail=f"Daily analysis limit reached for the {current_user.plan} plan")

        analyzer = get_analyzer()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Analyzer is not ready")

        result = run_analysis_and_log(db, analyzer, current_user, source)
        create_notification(
            db,
            user_id=current_user.id,
            title="Critical vulnerability detected" if result["prediction"] == "vulnerable" else "Analysis completed successfully",
            body=snippet_from_code(source, 110),
            severity="critical" if result["risk_score"] >= 70 else "info",
            category="analysis",
            action_url="/analyze",
            source_type="analysis_log",
            source_id=result["log_id"],
        )
        usage_after = increment_usage(db, current_user)
        result["remaining_today"] = usage_after["remaining_today"]
        return result

    @router.post("/analyze/live", response_model=AnalysisResponse)
    async def analyze_contract_live(
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
        analyzer = get_analyzer()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Analyzer is not ready")
        return preview_analysis(analyzer, source)

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

    @router.get("/chat/history", response_model=list[ChatMessageResponse])
    async def chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return get_chat_history(db, current_user, limit=24)

    @router.post("/chat/stream")
    async def chat_stream(payload: ChatRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        enforce_ip_rate_limit(request)
        enforce_user_rate_limit(current_user)

        async def event_stream():
            async for chunk in stream_chat_with_context(db, current_user, payload.message):
                yield chunk

        return StreamingResponse(event_stream(), media_type="text/plain")

    @router.get("/notifications", response_model=list[NotificationResponse])
    async def notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return list_notifications(db, current_user, limit=30)

    @router.post("/notifications/{notification_id}/read")
    async def read_notification(
        notification_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if not mark_notification_read(db, current_user, notification_id):
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"updated": True, "notification_id": notification_id}

    @router.post("/notifications/read-all")
    async def read_all_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        updated = mark_all_notifications_read(db, current_user)
        return {"updated": updated}

    @router.post("/fix-contract", response_model=FixContractResponse)
    async def fix_contract(payload: FixContractRequest, current_user: User = Depends(get_current_user)):
        source = payload.content
        findings = infer_vulnerability_findings(source)
        safe_patterns = infer_safe_patterns(source)
        risk_score = compute_risk_score("vulnerable" if findings else "secure", 0.72 if findings else 0.28, findings)
        fixed_code, highlighted_changes = generate_fixed_contract(source, findings)
        autofix_preview = build_autofix_preview(findings, safe_patterns)
        highlighted_changes = [autofix_preview, *highlighted_changes]
        summary = build_analysis_summary(
            "vulnerable" if findings else "secure",
            risk_score,
            findings,
            safe_patterns,
        )
        return FixContractResponse(
            fixed_code=fixed_code,
            summary=summary,
            highlighted_changes=highlighted_changes,
        )

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
            raise HTTPException(status_code=403, detail=f"Daily analysis limit reached for the {user.plan} plan")

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
