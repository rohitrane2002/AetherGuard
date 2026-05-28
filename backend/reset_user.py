from sqlalchemy import create_engine, update, select
from sqlalchemy.orm import sessionmaker
from models import User, Subscription

DATABASE_URL = "postgresql+psycopg://postgres:Rohit%40171125@db.jmaetcttktvbsncwgqnk.supabase.co:6543/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def reset_to_free(email):
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if user:
            # Update user plan
            db.execute(update(User).where(User.id == user.id).values(plan="free", subscription_status="active"))
            
            # Update subscription table
            sub = db.query(Subscription).filter(Subscription.user_id == user.id).order_by(Subscription.id.desc()).first()
            if sub:
                sub.plan = "free"
                sub.status = "active"
                db.add(sub)
            
            db.commit()
            print(f"Successfully reset {email} to Free tier.")
        else:
            print(f"User {email} not found.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_to_free("sarapunawala@gmail.com")
