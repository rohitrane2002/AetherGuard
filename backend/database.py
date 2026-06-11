from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

import logging
from config import settings

logger = logging.getLogger(__name__)

if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        settings.database_url,
        future=True,
        pool_pre_ping=True,
        connect_args=connect_args
    )
else:
    connect_args = {"sslmode": "require"}
    engine = create_engine(
        settings.database_url,
        future=True,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def verify_db_connection() -> bool:
    url = settings.database_url
    sanitized_url = url
    if "://" in url:
        scheme, rest = url.split("://", 1)
        if "@" in rest:
            userinfo, hostinfo = rest.rsplit("@", 1)
            if ":" in userinfo:
                username, password = userinfo.split(":", 1)
                userinfo = f"{username}:******"
            sanitized_url = f"{scheme}://{userinfo}@{hostinfo}"
            
    logger.info(f"Validating database connectivity: {sanitized_url}")
    
    import time
    from sqlalchemy.exc import OperationalError
    
    retries = 3
    delay = 2
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connectivity check passed.")
            return True
        except (OperationalError, Exception) as e:
            logger.warning(f"Database connection attempt {attempt} failed: {e}")
            if attempt < retries:
                time.sleep(delay)
                delay *= 2
            else:
                logger.error(f"Failed to connect to database after {retries} attempts.")
                
    return False


def ensure_runtime_schema_compatibility() -> None:
    # Import models so all tables are registered on Base before create_all runs.
    import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = engine.dialect.name

    if dialect == "postgresql":
        missing_user_columns = {
            "scans_used": "INTEGER NOT NULL DEFAULT 0",
            "subscription_status": "TEXT NOT NULL DEFAULT 'inactive'",
            "total_credits": "INTEGER NOT NULL DEFAULT 0",
            "stripe_customer_id": "TEXT",
            "is_admin": "BOOLEAN NOT NULL DEFAULT FALSE",
            "is_pro": "BOOLEAN NOT NULL DEFAULT FALSE",
            "provider": "TEXT NOT NULL DEFAULT 'email'",
            "avatar_url": "TEXT",
            "github_username": "TEXT",
            "github_access_token": "TEXT",
            "otp_code": "TEXT",
            "otp_expiry": "TIMESTAMP WITH TIME ZONE",
            "is_email_verified": "BOOLEAN NOT NULL DEFAULT FALSE",
        }
    else:
        missing_user_columns = {
            "scans_used": "INTEGER NOT NULL DEFAULT 0",
            "subscription_status": "TEXT NOT NULL DEFAULT 'inactive'",
            "total_credits": "INTEGER NOT NULL DEFAULT 0",
            "stripe_customer_id": "TEXT",
            "is_admin": "BOOLEAN NOT NULL DEFAULT 0",
            "is_pro": "BOOLEAN NOT NULL DEFAULT 0",
            "provider": "TEXT NOT NULL DEFAULT 'email'",
            "avatar_url": "TEXT",
            "github_username": "TEXT",
            "github_access_token": "TEXT",
            "otp_code": "TEXT",
            "otp_expiry": "DATETIME",
            "is_email_verified": "BOOLEAN NOT NULL DEFAULT 0",
        }

    with engine.begin() as connection:
        for column_name, column_sql in missing_user_columns.items():
            if column_name not in existing_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_sql}"))

        if "analysis_logs" in inspector.get_table_names():
            existing_log_columns = {column["name"] for column in inspector.get_columns("analysis_logs")}
            if "results_json" not in existing_log_columns:
                connection.execute(text("ALTER TABLE analysis_logs ADD COLUMN results_json TEXT"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
