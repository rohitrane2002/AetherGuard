from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text
from sqlalchemy.exc import OperationalError, ProgrammingError
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
    get_daily_limit_for_plan,
    get_plan_from_price_id,
    parse_webhook,
    stripe_is_configured,
)
from config import settings
from database import get_db
from models import AnalysisLog, SharedReport, Subscription, TeamMembership, User
from routes.auth_routes import router as auth_router
from routes.growth import router as growth_router
from routes.github_routes import router as github_router
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
    GuestStatsResponse,
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
from rule_engine import RuleEngine
from ai_engine import AIEngine
from scoring import ScoringEngine
from services.report_service import ReportService
import asyncio

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
    decrypt_secret,
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
    router.include_router(github_router)

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

    def _is_schema_drift_error(exc: Exception) -> bool:
        if isinstance(exc, (OperationalError, ProgrammingError)):
            return True
        message = str(exc).lower()
        drift_markers = (
            "does not exist",
            "undefined table",
            "undefined column",
            "no such table",
            "no such column",
            "relation ",
            "column ",
        )
        return any(marker in message for marker in drift_markers)

    def _fallback_usage(current_user: User) -> dict:
        plan = getattr(current_user, "plan", "free")
        total_credits = getattr(current_user, "total_credits", 0) or 0
        if plan == "founder":
            return {
                "subscription_plan": "founder",
                "daily_limit": 999999,
                "analyses_today": 0,
                "remaining_today": 999999,
                "total_credits": total_credits,
            }

        daily_limit = get_daily_limit_for_plan(plan)
        return {
            "subscription_plan": plan,
            "daily_limit": daily_limit,
            "analyses_today": 0,
            "remaining_today": daily_limit,
            "total_credits": total_credits,
        }

    def _fallback_workspace(current_user: User) -> dict:
        workspace_name = f"{current_user.email.split('@')[0].replace('.', ' ').title()} Security"
        return {
            "team_name": workspace_name,
            "members": 1,
            "role": "Owner",
            "shared_reports": 0,
            "notification_metrics": {"total": 0, "unread": 0, "critical": 0},
        }

    def _safe_usage(db: Session, current_user: User) -> dict:
        try:
            return get_user_usage(db, current_user)
        except Exception as exc:
            if not _is_schema_drift_error(exc):
                raise
            return _fallback_usage(current_user)

    def _safe_subscription(db: Session, current_user: User) -> Optional[Subscription]:
        try:
            return db.execute(
                select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
            ).scalar_one_or_none()
        except Exception as exc:
            if not _is_schema_drift_error(exc):
                raise
            return None

    def _safe_workspace_counts(db: Session, current_user: User) -> dict:
        try:
            return workspace_counts(db, current_user)
        except Exception as exc:
            if not _is_schema_drift_error(exc):
                raise
            return _fallback_workspace(current_user)

    def _safe_notifications(db: Session, current_user: User) -> tuple[list[dict], dict]:
        try:
            feed = list_notifications(db, current_user, limit=8)
            totals = notification_metrics(db, current_user)
            return feed, totals
        except Exception as exc:
            if not _is_schema_drift_error(exc):
                raise
            empty = {"total": 0, "unread": 0, "critical": 0}
            return [], empty

    def _safe_chat_history(db: Session, current_user: User) -> list[dict]:
        try:
            return get_chat_history(db, current_user, limit=12)
        except Exception as exc:
            if not _is_schema_drift_error(exc):
                raise
            return []

    def _safe_api_keys(db: Session, current_user: User):
        try:
            return list_api_keys(db, current_user)
        except Exception as exc:
            if not _is_schema_drift_error(exc):
                raise
            return []

    import time
    import logging
    logger = logging.getLogger(__name__)

    async def predict_with_custom_model(source: str, request: Request, current_user_email: str) -> dict:
        analyzer = get_analyzer()
        
        # Log incoming scan request
        logger.info(
            "Incoming scan request: endpoint=%s, user=%s, client_ip=%s, content_length=%d",
            request.url.path,
            current_user_email,
            request.client.host if request.client else "unknown",
            len(source)
        )
        
        model_backend = settings.model_backend
        logger.info("Calling model endpoint/backend: %s", model_backend)
        
        start_time = time.time()
        result = None
        exact_error = None
        
        if analyzer is not None:
            # Retry system (3 attempts)
            for attempt in range(3):
                try:
                    result = analyzer.predict(source)
                    exact_error = None
                    break
                except Exception as e:
                    exact_error = e
                    logger.warning("Prediction attempt %d failed: %s", attempt + 1, e)
                    if attempt < 2:
                        await asyncio.sleep(0.1)
        else:
            exact_error = RuntimeError("Analyzer model is not initialized")
            
        inference_duration = time.time() - start_time
        
        if result is not None:
            # Log successful prediction details
            logger.info(
                "Scan complete: model=%s, duration=%.4fs, prediction=%s, prob_vulnerable=%.4f",
                model_backend,
                inference_duration,
                result.get("prediction"),
                result.get("prob_vulnerable", 0.0)
            )
            # Log raw model response
            logger.info("Raw model response: %s", result)
            return {
                "prediction": result["prediction"],
                "prob_secure": result["prob_secure"],
                "prob_vulnerable": result["prob_vulnerable"],
                "model_source": result["model_source"],
                "duration": inference_duration
            }
        else:
            # Log exact thrown error
            logger.error(
                "Prediction failed. Triggering heuristic fallback. Error: %s",
                exact_error,
                exc_info=True
            )
            # Heuristic fallback analysis
            findings = infer_vulnerability_findings(source)
            prediction = "vulnerable" if findings else "secure"
            prob_vulnerable = 0.8 if prediction == "vulnerable" else 0.1
            prob_secure = 1.0 - prob_vulnerable
            return {
                "prediction": prediction,
                "prob_secure": prob_secure,
                "prob_vulnerable": prob_vulnerable,
                "model_source": "heuristic-fallback",
                "duration": inference_duration,
                "error": str(exact_error)
            }

    router.include_router(growth_router)
    
    @router.get("/analyze/stats", response_model=GuestStatsResponse)
    async def get_scan_stats(request: Request, db: Session = Depends(get_db)):
        client_ip = request.client.host if request.client else "unknown"
        # Social Proof: Total scans across the platform
        total_count = db.execute(select(func.count(AnalysisLog.id))).scalar() or 1248 # Fallback to a high number
        
        # Urgency: Scans left for this IP
        guest_limit = 3
        current_usage = rate_limiter.get_usage(f"guest_ip:{client_ip}", 86400) # 24h window
        remaining = max(0, guest_limit - current_usage)
        
        return GuestStatsResponse(
            total_scanned=total_count,
            remaining_guest_scans=remaining
        )

    @router.get("/health", response_model=HealthResponse)
    async def health_check(db: Session = Depends(get_db)):
        analyzer = get_analyzer()
        
        # Verify database connectivity
        database_connected = True
        try:
            db.execute(text("SELECT 1"))
        except Exception:
            database_connected = False

        backend_status = "online" if database_connected else "offline"
        ai_model_status = "connected" if analyzer is not None else "disconnected"
        
        inference_status = "working"
        if analyzer is not None:
            try:
                # Verify that inference is working by running a quick prediction
                analyzer.predict("pragma solidity ^0.8.0; contract Test {}")
            except Exception as e:
                import logging
                logging.getLogger(__name__).exception("Health check inference test failed")
                inference_status = "failed"
        else:
            inference_status = "failed"

        return HealthResponse(
            backend=backend_status,
            ai_model=ai_model_status,
            inference=inference_status,
        )

    @router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
    async def dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        try:
            subscription = _safe_subscription(db, current_user)
            usage = _safe_usage(db, current_user)
            recent_logs = db.execute(
                select(AnalysisLog).where(AnalysisLog.user_id == current_user.id).order_by(AnalysisLog.id.desc()).limit(6)
            ).scalars().all()
            workspace = _safe_workspace_counts(db, current_user)
            notifications_feed, notification_totals = _safe_notifications(db, current_user)
            
            recent_scans = [
                {
                    "id": log.id,
                    "prediction": log.prediction,
                    "confidence": log.confidence,
                    "timestamp": log.created_at.isoformat(),
                    "contract_snippet": snippet_from_code(log.source_code),
                    "risk_score": max(0, min(100, int(round(log.prob_vulnerable * 100)))),
                }
                for log in recent_logs
            ]
            
            return DashboardSummaryResponse(
                account={
                    "id": str(current_user.id),
                    "email": current_user.email,
                    "plan": subscription.plan if subscription else current_user.plan,
                    "status": subscription.status if subscription else current_user.subscription_status,
                },
                usage=usage,
                recent_scans=recent_scans,
                chat_history=_safe_chat_history(db, current_user),
                notifications=notifications_feed,
                workspace={**workspace, "notification_metrics": notification_totals},
            )
        except Exception as e:
            import traceback
            raise HTTPException(status_code=500, detail=f"PRODUCTION_CRASH: {str(e)}\n{traceback.format_exc()}")

    @router.get("/account", response_model=AccountResponse)
    async def read_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        subscription = _safe_subscription(db, current_user)
        return AccountResponse(
            id=current_user.id,
            email=current_user.email,
            is_active=current_user.is_active,
            is_admin=current_user.is_admin,
            subscription_plan=subscription.plan if subscription else current_user.plan,
            subscription_status=subscription.status if subscription else current_user.subscription_status,
            stripe_customer_id=subscription.stripe_customer_id if subscription else current_user.stripe_customer_id,
            created_at=current_user.created_at,
        )

    @router.get("/usage", response_model=UsageResponse)
    async def read_usage(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        return UsageResponse(**_safe_usage(db, current_user))

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

    @router.post("/ops/provision-subscription", response_model=CheckoutSessionResponse)
    async def create_checkout(payload: CheckoutSessionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        try:
            session = create_checkout_session(payload.price_id, current_user.email)
            subscription = db.scalars(
                select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
            ).first()
            if subscription is None:
                subscription = Subscription(user_id=current_user.id)
            status = "active" if session["mode"] == "mock" or session["plan"] == "free" else "checkout_created"
            subscription.plan = session["plan"]
            subscription.status = status
            subscription.stripe_customer_id = session["customer_id"]
            subscription.stripe_price_id = session["price_id"]
            subscription.stripe_subscription_id = session["subscription_id"]
            current_user.plan = session["plan"]
            current_user.subscription_status = status
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
        except Exception as e:
            print(f"CHECKOUT ERROR DIAGNOSTIC: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Diagnostic error: {str(e)}")


    @router.post("/create-billing-portal-session", response_model=BillingPortalResponse)
    async def create_billing_portal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        subscription = db.scalars(
            select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
        ).first()
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
            subscription_user = db.scalars(
                select(Subscription).where(Subscription.stripe_customer_id == stripe_customer_id).order_by(Subscription.id.desc())
            ).first()
            if subscription_user is not None:
                user = db.execute(select(User).where(User.id == subscription_user.user_id)).scalar_one_or_none()

        if user is None:
            raise HTTPException(status_code=404, detail="User not found for Stripe event")

        subscription = db.scalars(
            select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.id.desc())
        ).first()
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

        # Step 1: Model Prediction & Logging (our custom model)
        model_result = await predict_with_custom_model(source, request, current_user.email)

        # Step 2: Heuristic Analysis Engines
        rule_engine = RuleEngine()
        score_engine = ScoringEngine()

        await asyncio.sleep(0.5) # UX delay
        rule_issues = rule_engine.analyze(source)
        heuristic_findings = infer_vulnerability_findings(source)
        safe_patterns = infer_safe_patterns(source)

        # Merge structural issues from rule engine and heuristics
        all_issues = []
        seen_slugs = set()
        for issue in rule_issues:
            slug = issue.get("id", "rule-vulnerability")
            seen_slugs.add(slug)
            all_issues.append({
                "slug": slug,
                "label": issue.get("name", "Vulnerability Detected"),
                "severity": issue.get("severity", "medium"),
                "confidence": 0.95,
                "summary": issue.get("description", "Structural check vulnerability detected."),
                "recommendation": issue.get("recommendation", "Review code structure and access controls."),
                "line_numbers": issue.get("line_numbers", []),
            })

        for issue in heuristic_findings:
            slug = issue.get("slug")
            if slug not in seen_slugs:
                seen_slugs.add(slug)
                all_issues.append({
                    "slug": slug,
                    "label": issue.get("label", "Vulnerability Detected"),
                    "severity": issue.get("severity", "medium"),
                    "confidence": issue.get("confidence", 0.85),
                    "summary": issue.get("summary", "Heuristic check vulnerability detected."),
                    "recommendation": issue.get("recommendation", "Harden affected patterns."),
                    "line_numbers": [],
                })

        # Inject semantic vulnerability from custom model if flagged and no structural findings
        if model_result["prediction"] == "vulnerable" and not all_issues:
            all_issues.append({
                "slug": "semantic-vulnerability",
                "label": "Semantic Logic Vulnerability",
                "severity": "high",
                "confidence": model_result["prob_vulnerable"],
                "summary": "Deep model scan flagged potential structural or logical anomalies.",
                "recommendation": "Perform a manual line-by-line review of access permissions and state modifications.",
                "line_numbers": []
            })

        score_data = score_engine.calculate(all_issues)
        benchmarks = score_engine.get_benchmarks(score_data["score"])

        # Step 3: Local secure rewrite & explanation fallback
        fixed_code, highlighted_changes = generate_fixed_contract(source, all_issues)
        explanation = build_analysis_summary(model_result["prediction"], score_data["score"], all_issues, safe_patterns)

        # Optional OpenAI/OpenRouter AI Engine for higher-fidelity reasoning if api_key is configured
        ai_engine = AIEngine()
        poc_test = None
        if ai_engine.api_key:
            try:
                ai_result = ai_engine.analyze_code(source, all_issues)
                explanation = ai_result.get("explanation", explanation)
                fixed_code = ai_result.get("fix", fixed_code)
                poc_test = ai_engine.generate_poc_test(source, all_issues)
            except Exception as e:
                logger.warning("Optional AI Engine reasoning failed: %s", e)

        findings = []
        for issue in all_issues:
            findings.append({
                "slug": issue.get("slug"),
                "label": issue.get("label"),
                "severity": issue.get("severity"),
                "confidence": issue.get("confidence"),
                "summary": issue.get("summary"),
                "recommendation": issue.get("recommendation"),
                "line_numbers": issue.get("line_numbers", []),
            })

        final_result = {
            "score": score_data["score"],
            "severity": score_data["severity"],
            "benchmarks": benchmarks,
            "issues": [f.get("label", "Issue") for f in findings],
            "findings": findings,
            "steps": [
                "Rule engine completed: Structural check finished.",
                f"Custom model '{model_result['model_source']}' performed audit.",
                "Scoring engine calculated risk at " + str(score_data["score"]) + "/100.",
                "Benchmarking analysis compared results with industry standards.",
                "Secure remediation rewrite compiled.",
                "AI synthesized a Proof-of-Concept exploit test." if poc_test else "Local remediation preview ready."
            ],
            "explanation": explanation,
            "fix": fixed_code,
            "poc_test": poc_test,
            "confidence": model_result["prob_vulnerable"] if model_result["prediction"] == "vulnerable" else model_result["prob_secure"],
            "log_id": 0,
            "risk_score": score_data["score"],
            "summary": explanation,
            "report_url": f"/api/reports/{{log_id}}/download",
            "fix_suggestions": build_fix_suggestions(all_issues),
            "safe_patterns": safe_patterns,
            "autofix_preview": build_autofix_preview(all_issues, safe_patterns),
            "prediction": model_result["prediction"],
            "prob_secure": model_result["prob_secure"],
            "prob_vulnerable": model_result["prob_vulnerable"],
            "model_source": model_result["model_source"],
        }

        # Log to DB (Existing functionality)
        analysis_log = AnalysisLog(
            user_id=current_user.id,
            user_email=current_user.email,
            source_code=source,
            prediction=model_result["prediction"],
            prob_secure=model_result["prob_secure"],
            prob_vulnerable=model_result["prob_vulnerable"],
            confidence=final_result["confidence"],
            model_source=model_result["model_source"],
        )
        db.add(analysis_log)
        db.commit()
        db.refresh(analysis_log)
        final_result["log_id"] = analysis_log.id
        final_result["report_url"] = f"/api/reports/{analysis_log.id}/download"

        usage_after = increment_usage(db, current_user)
        final_result["remaining_today"] = usage_after["remaining_today"]
        return final_result

    @router.post("/analyze/guest", response_model=AnalysisResponse)
    async def analyze_contract_guest(
        payload: dict,
        request: Request,
        db: Session = Depends(get_db),
    ):
        client_ip = request.client.host if request.client else "unknown"
        usage_key = f"guest_ip:{client_ip}"
        
        # Urgency: Strict guest limit
        if not rate_limiter.allow(usage_key, 3, 86400):
            raise HTTPException(status_code=403, detail="GUEST_LIMIT_REACHED")

        source = payload.get("content", "")
        if not source.strip():
            raise HTTPException(status_code=400, detail="Contract source is required")
        
        # Use our predict_with_custom_model
        model_result = await predict_with_custom_model(source, request, "guest")
        
        rule_engine = RuleEngine()
        score_engine = ScoringEngine()

        rule_issues = rule_engine.analyze(source)
        heuristic_findings = infer_vulnerability_findings(source)
        safe_patterns = infer_safe_patterns(source)

        # Merge structural issues
        all_issues = []
        seen_slugs = set()
        for issue in rule_issues:
            slug = issue.get("id", "rule-vulnerability")
            seen_slugs.add(slug)
            all_issues.append({
                "slug": slug,
                "label": issue.get("name", "Vulnerability Detected"),
                "severity": issue.get("severity", "medium"),
                "confidence": 0.95,
                "summary": issue.get("description", "Structural check vulnerability detected."),
                "recommendation": issue.get("recommendation", "Review code structure and access controls."),
                "line_numbers": issue.get("line_numbers", []),
            })

        for issue in heuristic_findings:
            slug = issue.get("slug")
            if slug not in seen_slugs:
                seen_slugs.add(slug)
                all_issues.append({
                    "slug": slug,
                    "label": issue.get("label", "Vulnerability Detected"),
                    "severity": issue.get("severity", "medium"),
                    "confidence": issue.get("confidence", 0.85),
                    "summary": issue.get("summary", "Heuristic check vulnerability detected."),
                    "recommendation": issue.get("recommendation", "Harden affected patterns."),
                    "line_numbers": [],
                })

        if model_result["prediction"] == "vulnerable" and not all_issues:
            all_issues.append({
                "slug": "semantic-vulnerability",
                "label": "Semantic Logic Vulnerability",
                "severity": "high",
                "confidence": model_result["prob_vulnerable"],
                "summary": "Deep model scan flagged potential structural or logical anomalies.",
                "recommendation": "Perform a manual review of access permissions and state modifications.",
                "line_numbers": []
            })

        score_data = score_engine.calculate(all_issues)

        # Soft Paywall: Mask sensitive fields for guests
        masked_findings = []
        for issue in all_issues:
            is_critical = issue.get("severity") == "high" or issue.get("severity") == "critical"
            masked_findings.append({
                "slug": issue.get("slug", "secret"),
                "label": issue.get("label", "Vulnerability Detected"),
                "severity": issue.get("severity", "medium"),
                "confidence": issue.get("confidence", 0.9),
                "summary": "Upgrade to Pro to view the full impact and mitigation of this finding." if is_critical else issue.get("summary"),
                "recommendation": "Register a free account to unlock fix suggestions." if is_critical else issue.get("recommendation"),
                "line_numbers": issue.get("line_numbers", []),
            })

        # Track guest scan in logs
        rate_limiter.increment(usage_key, 86400)

        # Soft Paywall: Mask explanation and fix
        explanation = "Result partially masked. Sign up to unlock full deep-ai reasoning and remediations."
        fix = "// Code rewrite locked. Create an account to generate secure code."

        return {
            "score": score_data["score"],
            "severity": score_data["severity"],
            "issues": [f["label"] for f in masked_findings],
            "findings": masked_findings,
            "steps": ["Guest analysis complete. Pre-deployment audit finished."],
            "explanation": explanation,
            "fix": fix,
            "confidence": model_result["prob_vulnerable"] if model_result["prediction"] == "vulnerable" else model_result["prob_secure"],
            "log_id": 0,
            "risk_score": score_data["score"],
            "summary": "Guest Scan Summary",
            "fix_suggestions": ["Unlock Pro to see suggestions"],
            "remaining_today": max(0, 3 - rate_limiter.get_usage(usage_key, 86400)),
            "prediction": model_result["prediction"],
            "prob_secure": model_result["prob_secure"],
            "prob_vulnerable": model_result["prob_vulnerable"],
            "model_source": model_result["model_source"],
        }


    @router.post("/analyze/live", response_model=AnalysisResponse)
    async def analyze_contract_live(
        payload: dict,
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        source = payload.get("content", "")
        # Minimal live scan
        rule_engine = RuleEngine()
        rule_issues = rule_engine.analyze(source)
        score_engine = ScoringEngine()
        score_data = score_engine.calculate(rule_issues)
        
        findings = [
            {
                "slug": issue["id"],
                "label": issue["name"],
                "severity": issue["severity"],
                "confidence": 0.95,
                "summary": issue["description"],
                "recommendation": "Review sensitive logic.",
                "line_numbers": issue["line_numbers"]
            }
            for issue in rule_issues
        ]

        return {
            "score": score_data["score"],
            "severity": score_data["severity"],
            "issues": [i["name"] for i in rule_issues],
            "findings": findings,
            "steps": ["Live scan completed."],
            "explanation": "Live structural analysis active.",
            "fix": "",
            "confidence": 1.0,
            "log_id": 0,
            "risk_score": score_data["score"],
            "summary": "Live analysis summary",
            "fix_suggestions": [],
            "safe_patterns": [],
            "autofix_preview": "",
            "remaining_today": 999999 if current_user.plan == "founder" else 0
        }

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
        if not source.strip():
            raise HTTPException(status_code=400, detail="Contract source is required")
        
        rule_engine = RuleEngine()
        ai_engine = AIEngine()
        
        # Detect issues to inform the AI
        issues = rule_engine.analyze(source)
        
        # Generate the fix
        result = ai_engine.analyze_code(source, issues)
        
        return FixContractResponse(
            fixed_code=result["fix"],
            summary=result["explanation"],
            highlighted_changes=[f"Fixed {issue['name']}" for issue in issues] if issues else ["Optimized contract structure and safety patterns."]
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
        return _safe_api_keys(db, current_user)

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

    @router.get("/reports/{log_id}/download")
    async def download_report(
        log_id: int,
        format: str = "markdown",
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        log = db.execute(
            select(AnalysisLog).where(
                AnalysisLog.id == log_id,
                AnalysisLog.user_id == current_user.id
            )
        ).scalar_one_or_none()
        
        if not log:
            raise HTTPException(status_code=404, detail="Analysis log not found")

        # In a real app, you'd re-hydrate the full analysis data from the log
        # For now, we'll reconstruct a basic version for the report
        mock_data = {
            "score": int(log.prob_vulnerable * 100),
            "severity": "high" if log.prob_vulnerable > 0.7 else "medium" if log.prob_vulnerable > 0.3 else "low",
            "summary": "Automated security audit summary based on analysis history.",
            "findings": [], 
            "fix_suggestions": ["Review contract state transitions", "Implement access control"],
            "fix": "// Re-run analysis to generate fix code."
        }
        
        report_content = ReportService.generate_markdown_report(mock_data)
        
        return {
            "filename": f"AetherGuard_Audit_{log_id}.md",
            "content": report_content
        }

    @router.get("/predict/failure")
    async def protected_failure_example(current_user: User = Depends(get_current_user)):
        return {"ok": True, "user": current_user.email}

    # ─── GitHub Repo Scanner ─────────────────────────────────────────

    @router.get("/github/repos")
    async def list_github_repos(
        page: int = Query(default=1, ge=1),
        current_user: User = Depends(get_current_user),
    ):
        """List the authenticated user's GitHub repos (requires GitHub OAuth login)."""
        decrypted_token = decrypt_secret(current_user.github_access_token)
        if not decrypted_token:
            raise HTTPException(status_code=400, detail="GitHub account not linked. Please sign in with GitHub first.")
        from services.github_service import fetch_github_repos
        repos = await fetch_github_repos(decrypted_token, page=page)
        return {"repos": repos, "github_username": current_user.github_username}

    @router.get("/github/repos/{owner}/{repo}/sol-files")
    async def list_sol_files(
        owner: str,
        repo: str,
        branch: str = Query(default="main"),
        current_user: User = Depends(get_current_user),
    ):
        """Find all .sol files in a GitHub repository."""
        decrypted_token = decrypt_secret(current_user.github_access_token)
        if not decrypted_token:
            raise HTTPException(status_code=400, detail="GitHub account not linked.")
        from services.github_service import fetch_sol_files
        files = await fetch_sol_files(decrypted_token, owner, repo, branch)
        return {"files": files, "repo": f"{owner}/{repo}", "count": len(files)}

    @router.post("/github/repos/{owner}/{repo}/scan")
    async def scan_sol_file(
        owner: str,
        repo: str,
        payload: dict,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        """Fetch a .sol file from GitHub and run it through the analyzer."""
        decrypted_token = decrypt_secret(current_user.github_access_token)
        if not decrypted_token:
            raise HTTPException(status_code=400, detail="GitHub account not linked.")

        file_path = payload.get("path", "")
        if not file_path.endswith(".sol"):
            raise HTTPException(status_code=400, detail="Only .sol files can be scanned")

        from services.github_service import fetch_file_content
        content = await fetch_file_content(decrypted_token, owner, repo, file_path)
        if content is None:
            raise HTTPException(status_code=404, detail="File not found in repository")

        analyzer = get_analyzer()
        if analyzer is None:
            raise HTTPException(status_code=503, detail="Analyzer is not ready")

        result = run_analysis_and_log(db, analyzer, current_user, content)
        result["file_path"] = file_path
        result["repo"] = f"{owner}/{repo}"
        return result

    return router
