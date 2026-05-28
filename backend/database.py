from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import settings


connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, future=True, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
