import hashlib
import secrets
from typing import Optional

import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def generate_secure_token(length: int = 48) -> str:
    return secrets.token_urlsafe(length)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def build_api_key(prefix: str = "ag") -> tuple[str, str, str]:
    secret = secrets.token_urlsafe(32)
    full_key = f"{prefix}_{secret}"
    key_hash = hash_token(full_key)
    key_prefix = full_key[:12]
    return full_key, key_hash, key_prefix


def compute_confidence(prob_secure: float, prob_vulnerable: float) -> float:
    return max(prob_secure, prob_vulnerable)


def snippet_from_code(code: str, max_chars: int = 240) -> str:
    trimmed = code.strip()
    return trimmed[:max_chars] + ("..." if len(trimmed) > max_chars else "")
