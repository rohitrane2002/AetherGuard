from sqlalchemy import create_engine, update, select
from sqlalchemy.orm import sessionmaker
from models import User, Subscription

DATABASE_URL = "postgresql+psycopg://postgres:Rohit%40171125@db.jmaetcttktvbsncwgqnk.supabase.co:6543/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def update_user_tiers(founder_email, free_email):
    db = SessionLocal()
    try:
        # 1. Upgrade Founder
        founder = db.execute(select(User).where(User.email == founder_email)).scalar_one_or_none()
        if founder:
            db.execute(update(User).where(User.id == founder.id).values(plan="founder", subscription_status="active"))
            print(f"Success: {founder_email} upgraded to Founder (Unlimited).")
        else:
            print(f"Error: {founder_email} not found.")

        # 2. Reset Sara to Free
        free_user = db.execute(select(User).where(User.email == free_email)).scalar_one_or_none()
        if free_user:
            db.execute(update(User).where(User.id == free_user.id).values(plan="free", subscription_status="active"))
            # Sync subscription entry if it exists
            sub = db.query(Subscription).filter(Subscription.user_id == free_user.id).order_by(Subscription.id.desc()).first()
            if sub:
                sub.plan = "free"
                sub.status = "active"
                db.add(sub)
            print(f"Success: {free_email} reset to Free tier.")
        else:
            print(f"Error: {free_email} not found.")

        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    update_user_tiers("founder@aetherguard.dev", "sarapunawala@gmail.com")
