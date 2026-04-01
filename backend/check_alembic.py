from sqlalchemy import create_engine, text
import os

DATABASE_URL = "postgresql+psycopg://postgres:Rohit%40171125@db.jmaetcttktvbsncwgqnk.supabase.co:6543/postgres"
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    result = conn.execute(text("SELECT version_num FROM alembic_version"))
    row = result.fetchone()
    print(f"CURRENT DATABASE REVISION: {row[0] if row else 'No table found'}")
