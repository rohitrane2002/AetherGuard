import sys
sys.path.append("/Users/rohitrane2002/AetherGuard/backend")

import uuid
import logging
from fastapi.testclient import TestClient
from main import app

try:
    client = TestClient(app)
    # create unique email
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    res = client.post("/auth/register", json={"email": email, "password": "password123"})
    res = client.post("/auth/login", data={"username": email, "password": "password123"})
    if res.status_code != 200:
        print("Login failed", res.text)
    else:
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        res2 = client.post("/create-checkout-session", headers=headers, json={"price_id": "test_price"})
        print("STATUS:", res2.status_code)
        print("BODY:", res2.text)
except Exception as e:
    logging.exception("Failed")
