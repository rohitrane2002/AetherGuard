import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_DIR = BASE_DIR / "model" / "trained_model"
DEFAULT_SQLITE_PATH = BASE_DIR / "aetherguard.db"


class Settings:
    def __init__(self) -> None:
        self.app_name = os.getenv("APP_NAME", "AetherGuard API")
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.model_dir = Path(os.getenv("MODEL_DIR", str(DEFAULT_MODEL_DIR)))
        self.model_repo_id = os.getenv("MODEL_REPO_ID")
        self.model_revision = os.getenv("MODEL_REVISION")
        self.model_source_url = os.getenv("MODEL_SOURCE_URL")
        self.hf_token = os.getenv("HF_TOKEN")
        self.allow_base_model_fallback = (
            os.getenv("ALLOW_BASE_MODEL_FALLBACK", "false").lower() == "true"
        )
        self.jwt_secret = os.getenv("JWT_SECRET", "dev-only-change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
        self.stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        self.stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        self.stripe_price_id_free = os.getenv("STRIPE_PRICE_ID_FREE")
        self.stripe_price_id_pro = os.getenv("STRIPE_PRICE_ID_PRO")
        self.stripe_price_id_enterprise = os.getenv("STRIPE_PRICE_ID_ENTERPRISE")
        self.stripe_success_url = os.getenv(
            "STRIPE_SUCCESS_URL",
            "https://aetherguard.vercel.app/account?checkout=success",
        )
        self.stripe_cancel_url = os.getenv(
            "STRIPE_CANCEL_URL",
            "https://aetherguard.vercel.app/pricing?checkout=cancelled",
        )
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.ai_model = os.getenv("AI_MODEL", "gpt-4o-mini")
        self.ai_base_url = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")
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

    @staticmethod
    def _normalize_database_url(database_url: str) -> str:
        if database_url.startswith("postgres://"):
            return database_url.replace("postgres://", "postgresql+psycopg://", 1)
        if database_url.startswith("postgresql://"):
            return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return database_url


settings = Settings()
