import asyncio
from sqlalchemy.orm import Session
from database import SessionLocal
from routes import build_router
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)
response = client.post("/analyze/live", json={"content": "contract Test {}"})
print(response.status_code, response.text)
