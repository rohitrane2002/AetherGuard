import asyncio
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from models import User, Subscription, AnalysisLog, Notification, SharedReport, TeamMembership, Team
from schemas import DashboardSummaryResponse
from services.usage_service import get_user_usage
from services.notification_service import list_notifications, notification_metrics
from services.workspace_service import workspace_counts
from services.chat_service import get_chat_history
from services.security_service import snippet_from_code

DATABASE_URL = "postgresql+psycopg://postgres:Rohit%40171125@db.jmaetcttktvbsncwgqnk.supabase.co:6543/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_pydantic():
    with SessionLocal() as db:
        try:
            current_user = db.execute(select(User).where(User.email == "founder@aetherguard.dev")).scalar_one_or_none()
            if not current_user:
                print("User not found!")
                return

            subscription = db.execute(
                select(Subscription).where(Subscription.user_id == current_user.id).order_by(Subscription.id.desc())
            ).scalar_one_or_none()
            usage = get_user_usage(db, current_user)
            recent_logs = db.execute(
                select(AnalysisLog).where(AnalysisLog.user_id == current_user.id).order_by(AnalysisLog.id.desc()).limit(6)
            ).scalars().all()
            workspace = workspace_counts(db, current_user)
            notifications_feed = list_notifications(db, current_user, limit=8)
            notification_totals = notification_metrics(db, current_user)
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
            
            chat_hist = get_chat_history(db, current_user, limit=12)
            
            resp = DashboardSummaryResponse(
                account={
                    "id": str(current_user.id),
                    "email": current_user.email,
                    "plan": subscription.plan if subscription else current_user.plan,
                    "status": subscription.status if subscription else current_user.subscription_status,
                },
                usage=usage,
                recent_scans=recent_scans,
                chat_history=chat_hist,
                notifications=notifications_feed,
                workspace={**workspace, "notification_metrics": notification_totals},
            )
            print("Pydantic validation SUCCESS!")
            print(resp.model_dump_json())
        except Exception as e:
            print("PYDANTIC ERROR:")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_pydantic()
