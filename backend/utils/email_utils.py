import re

# List of common disposable email domains
DISPOSABLE_DOMAINS = {
    "mailinator.com", "yopmail.com", "guerrillamail.com", "10minutemail.com",
    "temp-mail.org", "maildrop.cc", "dispostable.com", "getnada.com",
    "trashmail.com", "sharklasers.com", "fakeinbox.com", "mailnesia.com",
    "mt2015.com", "mailhub.cc", "tempmail.net", "burnermail.io"
}

def is_disposable_email(email: str) -> bool:
    """Check if the email domain is in the disposable domains list."""
    domain = email.split("@")[-1].lower()
    return domain in DISPOSABLE_DOMAINS

def validate_email_format(email: str) -> bool:
    """Basic regex check for email format."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email) is not None
