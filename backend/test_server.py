import logging
import sys
sys.path.append("/Users/rohitrane2002/AetherGuard/backend")

from fastapi.testclient import TestClient
from main import app

try:
    client = TestClient(app)
    response = client.post("/analyze/live", json={"content": "contract Test {}"})
    print("STATUS:", response.status_code)
    print("BODY:", response.text)
except Exception as e:
    logging.exception("Failed")
