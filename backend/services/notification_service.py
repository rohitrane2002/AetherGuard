from sqlalchemy import select, update
from sqlalchemy.orm import Session
from typing import Optional

from models import AnalysisLog, Notification, SharedReport, Subscription, TeamMembership, User
from services.security_service import snippet_from_code


def _build_notification_payload(record: Notification) -> dict:
    return {
        "id": record.id,
        "title": record.title,
        "body": record.body,
        "severity": record.severity,
        "category": record.category,
        "is_read": record.is_read,
        "action_url": record.action_url,
        "timestamp": record.created_at.isoformat(),
    }


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    body: str,
    severity: str = "info",
    category: str = "system",
    action_url: Optional[str] = None,
    source_type: Optional[str] = None,
    source_id: Optional[int] = None,
) -> Notification:
    if source_type is not None and source_id is not None:
        existing = db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.source_type == source_type,
                Notification.source_id == source_id,
            )
        ).scalar_one_or_none()
        if existing is not None:
            return existing

    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        severity=severity,
        category=category,
        action_url=action_url,
        source_type=source_type,
        source_id=source_id,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def sync_user_notifications(db: Session, user: User) -> None:
    recent_logs = db.execute(
        select(AnalysisLog).where(AnalysisLog.user_id == user.id).order_by(AnalysisLog.id.desc()).limit(8)
    ).scalars().all()
    for log in recent_logs:
        severity = "critical" if log.prediction == "vulnerable" and log.confidence >= 0.72 else "info"
        title = "Critical vulnerability detected" if severity == "critical" else "Latest analysis completed"
        create_notification(
            db,
            user_id=user.id,
            title=title,
            body=snippet_from_code(log.source_code, 110),
            severity=severity,
            category="analysis",
            action_url="/analyze",
            source_type="analysis_log",
            source_id=log.id,
        )

    pending_invites = db.execute(
        select(TeamMembership).where(
            TeamMembership.invited_email == user.email,
            TeamMembership.status == "invited",
        )
    ).scalars().all()
    for invite in pending_invites:
        create_notification(
            db,
            user_id=user.id,
            title="Workspace invitation waiting",
            body=f"You have a pending invitation as {invite.role} for a shared AetherGuard workspace.",
            severity="info",
            category="workspace",
            action_url="/workspace",
            source_type="team_membership",
            source_id=invite.id,
        )

    shared_reports = db.execute(
        select(SharedReport).where(SharedReport.shared_by_user_id == user.id).order_by(SharedReport.id.desc()).limit(4)
    ).scalars().all()
    for report in shared_reports:
        create_notification(
            db,
            user_id=user.id,
            title="Audit report shared to workspace",
            body="A scan has been published into your shared report stream for team review.",
            severity="info",
            category="workspace",
            action_url="/reports",
            source_type="shared_report",
            source_id=report.id,
        )

    subscription = db.execute(
        select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.id.desc())
    ).scalar_one_or_none()
    if subscription is not None and subscription.plan == "free":
        create_notification(
            db,
            user_id=user.id,
            title="Free plan capacity notice",
            body="Upgrade to Pro to unlock higher scan volume, richer copilot throughput, and production-ready team workflows.",
            severity="warning",
            category="billing",
            action_url="/pricing",
            source_type="billing_plan",
            source_id=1,
        )


def list_notifications(db: Session, user: User, limit: int = 30) -> list[dict]:
    sync_user_notifications(db, user)
    records = db.execute(
        select(Notification).where(Notification.user_id == user.id).order_by(Notification.id.desc()).limit(limit)
    ).scalars().all()
    return [_build_notification_payload(record) for record in records]


def notification_metrics(db: Session, user: User) -> dict:
    records = db.execute(select(Notification).where(Notification.user_id == user.id)).scalars().all()
    unread = sum(1 for record in records if not record.is_read)
    critical = sum(1 for record in records if record.severity == "critical")
    return {
        "total": len(records),
        "unread": unread,
        "critical": critical,
    }


def mark_notification_read(db: Session, user: User, notification_id: int) -> bool:
    notification = db.execute(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
    ).scalar_one_or_none()
    if notification is None:
        return False
    notification.is_read = True
    db.add(notification)
    db.commit()
    return True


def mark_all_notifications_read(db: Session, user: User) -> int:
    result = db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read.is_(False))
        .values(is_read=True)
    )
    db.commit()
    return result.rowcount or 0
