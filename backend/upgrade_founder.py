import sys
from sqlalchemy import select, update
from database import SessionLocal
from models import User

def upgrade_to_founder(email):
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            print(f"Error: User with email {email} not found.")
            return

        db.execute(
            update(User)
            .where(User.id == user.id)
            .values(plan="founder", subscription_status="active")
        )
        db.commit()
        print(f"Success! Account '{email}' has been upgraded to Founder status with unlimited scans.")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python upgrade_founder.py <user_email>")
    else:
        upgrade_to_founder(sys.argv[1])
