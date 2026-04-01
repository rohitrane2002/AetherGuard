import asyncio
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from models import User, Subscription, AnalysisLog, Notification, SharedReport, TeamMembership, Team
from services.usage_service import get_user_usage
from services.notification_service import list_notifications, notification_metrics
from services.workspace_service import workspace_counts
from services.chat_service import get_chat_history
from database import Base

DATABASE_URL = "postgresql+psycopg://postgres:Rohit%40171125@db.jmaetcttktvbsncwgqnk.supabase.co:6543/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_summary():
    with SessionLocal() as db:
        try:
            current_user = db.execute(select(User).where(User.email == "founder@aetherguard.dev")).scalar_one_or_none()
            if not current_user:
                print("User not found!")
                return

            print("Testing subscription...")
            subscription = db.execute(
                select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
            ).scalar_one_or_none()

            print("Testing usage...")
            usage = get_user_usage(db, current_user)

            print("Testing recent_logs...")
            recent_logs = db.execute(
                select(AnalysisLog).where(AnalysisLog.user_id == current_user.id).order_by(AnalysisLog.id.desc()).limit(6)
            ).scalars().all()

            print("Testing workspace_counts...")
            workspace = workspace_counts(db, current_user)

            print("Testing list_notifications...")
            notifications_feed = list_notifications(db, current_user, limit=8)

            print("Testing notification_metrics...")
            notification_totals = notification_metrics(db, current_user)

            print("Testing get_chat_history...")
            chat_history = get_chat_history(db, current_user, limit=12)

            print("SUCCESS! No crash.")
        except Exception as e:
            print(f"FAILED WITH EXCEPTION: {repr(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_summary()
