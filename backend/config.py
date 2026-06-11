import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_DIR = BASE_DIR / "model" / "trained_model"
DEFAULT_SQLITE_PATH = BASE_DIR / "aetherguard.db"


class Settings:
    def __init__(self) -> None:
        self.app_name = os.getenv("APP_NAME", "AetherGuard API")
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.model_backend = os.getenv("MODEL_BACKEND", "lightweight").lower()
        self.model_dir = Path(os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR)))
        self.model_repo_id = os.getenv("MODEL_REPO_ID")
        self.model_revision = os.getenv("MODEL_REVISION")
        self.model_source_url = os.getenv("MODEL_SOURCE_URL")
        self.hf_token = os.getenv("HF_TOKEN")
        self.lightweight_model_path = Path(
            os.getenv("LIGHTWEIGHT_MODEL_PATH", str(BASE_DIR / "model" / "vuln_model.joblib"))
        )
        self.lightweight_vectorizer_path = Path(
            os.getenv(
                "LIGHTWEIGHT_VECTORIZER_PATH",
                str(BASE_DIR / "model" / "tfidf_vectorizer.joblib"),
            )
        )
        self.allow_base_model_fallback = (
            os.getenv("ALLOW_BASE_MODEL_FALLBACK", "false").lower() == "true"
        )
        self.jwt_secret = os.getenv("JWT_SECRET", "dev-only-change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.encryption_key = os.getenv("ENCRYPTION_KEY", "uO6O7lXkRyV3J9-2N5A1-eM_hLzI2Gq0d9oXyA2mIbc=")  # Hardcoded default for fallback so we don't crash apps but they should overwrite in prod.
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
        self.stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        self.stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        self.stripe_price_id_free = os.getenv("STRIPE_PRICE_ID_FREE")
        self.stripe_price_id_pro = os.getenv("STRIPE_PRICE_ID_PRO")
        self.stripe_price_id_enterprise = os.getenv("STRIPE_PRICE_ID_ENTERPRISE")
        self.stripe_success_url = os.getenv(
            "STRIPE_SUCCESS_URL",
            "https://aetherguard.ai/account?checkout=success",
        )
        self.stripe_cancel_url = os.getenv(
            "STRIPE_CANCEL_URL",
            "https://aetherguard.ai/pricing?checkout=cancelled",
        )
        self.stripe_billing_portal_return_url = os.getenv(
            "STRIPE_BILLING_PORTAL_RETURN_URL",
            "https://aetherguard.ai/account",
        )
        self.openai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY")
        self.ai_model = os.getenv("AI_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
        self.ai_base_url = os.getenv("AI_BASE_URL", "https://openrouter.ai/api/v1")
        self.ai_app_url = os.getenv("AI_APP_URL", "https://aetherguard.ai")
        self.ai_app_name = os.getenv("AI_APP_NAME", "AetherGuard")
        self.ai_system_prompt = os.getenv(
            "AI_SYSTEM_PROMPT",
            "You are AetherGuard Copilot. Explain Solidity vulnerabilities clearly, suggest concrete fixes, and stay concise.",
        )
        self.max_solidity_chars = int(os.getenv("MAX_SOLIDITY_CHARS", "50000"))
        self.user_rate_limit_per_minute = int(os.getenv("USER_RATE_LIMIT_PER_MINUTE", "30"))
        self.ip_rate_limit_per_minute = int(os.getenv("IP_RATE_LIMIT_PER_MINUTE", "60"))
        self.api_key_rate_limit_per_minute = int(os.getenv("API_KEY_RATE_LIMIT_PER_MINUTE", "120"))
        self.database_url = self._normalize_database_url(
            os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")
        )
        # OAuth
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.github_client_id = os.getenv("GITHUB_CLIENT_ID", "")
        self.github_client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")
        self.frontend_url = os.getenv("FRONTEND_URL", "https://aetherguard.ai")
        self.backend_url = os.getenv("BACKEND_URL", "https://aetherguard-api.onrender.com")

    @staticmethod
    def _normalize_database_url(database_url: str) -> str:
        if not database_url:
            return database_url
            
        if database_url.startswith("sqlite"):
            return database_url
            
        try:
            import urllib.parse
            
            # Extract scheme
            if "://" in database_url:
                scheme, rest = database_url.split("://", 1)
            else:
                scheme = "postgresql"
                rest = database_url
                
            # Normalize scheme for SQLAlchemy + psycopg3
            if scheme in ["postgres", "postgresql"]:
                scheme = "postgresql+psycopg"
            elif scheme == "postgresql+psycopg2":
                scheme = "postgresql+psycopg"
                
            # Separate credentials from host
            if "@" in rest:
                userinfo, hostinfo = rest.rsplit("@", 1)
                
                # Separate username and password
                if ":" in userinfo:
                    username, password = userinfo.split(":", 1)
                    # Unquote first to prevent double encoding
                    unquoted_password = urllib.parse.unquote(password)
                    quoted_password = urllib.parse.quote_plus(unquoted_password)
                else:
                    username = userinfo
                    quoted_password = None
                    
                unquoted_username = urllib.parse.unquote(username)
                # Keep dots safe for Supabase user pooler usernames (postgres.project-ref)
                quoted_username = urllib.parse.quote_plus(unquoted_username, safe=".")
                
                if quoted_password is not None:
                    rest = f"{quoted_username}:{quoted_password}@{hostinfo}"
                else:
                    rest = f"{quoted_username}@{hostinfo}"
            
            return f"{scheme}://{rest}"
        except Exception:
            # Fallback to simple replace if parser fails
            if database_url.startswith("postgres://"):
                return database_url.replace("postgres://", "postgresql+psycopg://", 1)
            if database_url.startswith("postgresql://"):
                return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
            return database_url


settings = Settings()
