import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session
from models import User

def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return "".join(random.choices(string.digits, k=length))

def create_otp_for_user(db: Session, user: User) -> str:
    """Generate and store an OTP for the user, expiring in 10 minutes."""
    otp = generate_otp()
    user.otp_code = otp
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.add(user)
    db.commit()
    return otp

def verify_otp_for_user(db: Session, user: User, code: str) -> bool:
    """Verify the OTP code and check if it has expired."""
    if not user.otp_code or not user.otp_expiry:
        return False
    
    # Check expiry
    if datetime.now(timezone.utc) > user.otp_expiry:
        return False
    
    if user.otp_code == code:
        user.is_email_verified = True
        user.otp_code = None
        user.otp_expiry = None
        db.add(user)
        db.commit()
        return True
    
    return False

def send_otp_email(email: str, otp: str):
    """
    Placeholder for sending an email. 
    In production, use Resend, SendGrid, or AWS SES.
    """
    print(f"\n[EMAIL SIMULATOR] To: {email}")
    print(f"[EMAIL SIMULATOR] Subject: Your AetherGuard Verification Code")
    print(f"[EMAIL SIMULATOR] Body: Your code is {otp}. It expires in 10 minutes.\n")
