from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from config import settings
from database import Base
from models import AnalysisLog  # noqa: F401


config = context.config
url = settings.database_url.replace("%", "%%")
print(f"ALEMBIC CONNECTING TO: {url[:20]}***")
config.set_main_option("sqlalchemy.url", url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    try:
        run_migrations_offline()
    except Exception as e:
        print(f"OFFLINE MIGRATION ERROR: {e}")
        import sys
        sys.exit(0)
else:
    try:
        run_migrations_online()
    except Exception as e:
        print(f"ONLINE MIGRATION ERROR: {e}")
        import sys
        sys.exit(0)


