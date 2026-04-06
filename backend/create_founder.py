import uuid
from database import SessionLocal
from models import User
from services.security_service import hash_password

def create_founder():
    db = SessionLocal()
    email = "founder@aetherguard.dev"
    password = "Rohit@171125"
    
    try:
        hashed = hash_password(password)
        existing = db.query(User).filter(User.email == email).first()
        
        if existing:
            existing.password_hash = hashed
            existing.plan = "founder"
            existing.subscription_status = "active"
            existing.is_active = True
            db.commit()
            print(f"Success! Existing user {email} updated to Founder status.")
        else:
            new_founder = User(
                id=uuid.uuid4(),
                email=email,
                password_hash=hashed,
                plan="founder",
                subscription_status="active",
                is_active=True
            )
            db.add(new_founder)
            db.commit()
            print(f"Success! New Founder account created: {email}")
        
        print(f"Password set to: {password}")

    finally:
        db.close()

if __name__ == "__main__":
    create_founder()
