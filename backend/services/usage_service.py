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
    daily_limit = get_daily_limit_for_plan(user.plan)
    
    # Founder plan bypass
    if user.plan == "founder":
        return {
            "subscription_plan": "founder",
            "daily_limit": 999999, 
            "analyses_today": row.scan_count,
            "remaining_today": 999999,
            "total_credits": user.total_credits,
        }
        
    remaining_today = max(daily_limit - row.scan_count, 0)
    return {
        "subscription_plan": user.plan,
        "daily_limit": daily_limit,
        "analyses_today": row.scan_count,
        "remaining_today": remaining_today,
        "total_credits": user.total_credits,
    }


def can_perform_scan(db: Session, user: User) -> bool:
    usage = get_user_usage(db, user)
    if usage["remaining_today"] > 0:
        return True
    if user.total_credits > 0:
        return True
    return False


def increment_usage(db: Session, user: User) -> dict:
    row = get_or_create_usage_row(db, user)
    usage = get_user_usage(db, user)
    
    if usage["remaining_today"] > 0:
        # Use daily subscription quota
        row.scan_count += 1
    elif user.total_credits > 0:
        # Fallback to pay-per-use credits
        user.total_credits -= 1
        db.add(user)
    else:
        # Should be blocked by can_perform_scan before reaching here
        pass

    row.last_scan_at = datetime.now(timezone.utc)
    db.add(row)
    db.commit()
    db.refresh(row)
    db.add(user) # Re-attach user to session if it was detached
    db.refresh(user)
    return get_user_usage(db, user)


def count_history(db: Session, user: User) -> int:
    return db.execute(select(func.count(AnalysisLog.id)).where(AnalysisLog.user_id == user.id)).scalar_one()
