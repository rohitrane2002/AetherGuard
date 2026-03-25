from datetime import date, datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from billing import get_daily_limit_for_plan
from models import AnalysisLog, UsageTracking, User


def get_or_create_usage_row(db: Session, user: User) -> UsageTracking:
    today = date.today()
    row = db.execute(
        select(UsageTracking).where(
            UsageTracking.user_id == user.id,
            UsageTracking.usage_date == today,
        )
    ).scalar_one_or_none()
    if row is None:
        row = UsageTracking(user_id=user.id, usage_date=today, scan_count=0)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def get_user_usage(db: Session, user: User) -> dict:
    row = get_or_create_usage_row(db, user)
    daily_limit = get_daily_limit_for_plan(user.subscription_plan)
    remaining_today = max(daily_limit - row.scan_count, 0)
    return {
        "subscription_plan": user.subscription_plan,
        "daily_limit": daily_limit,
        "analyses_today": row.scan_count,
        "remaining_today": remaining_today,
    }


def increment_usage(db: Session, user: User) -> dict:
    row = get_or_create_usage_row(db, user)
    row.scan_count += 1
    row.last_scan_at = datetime.now(timezone.utc)
    db.add(row)
    db.commit()
    db.refresh(row)
    return get_user_usage(db, user)


def count_history(db: Session, user: User) -> int:
    return db.execute(select(func.count(AnalysisLog.id)).where(AnalysisLog.user_id == user.id)).scalar_one()
