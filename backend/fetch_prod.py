import requests
import sys

base_url = "https://aetherguard-api.onrender.com"

# 1. Register a new user to test fresh
email = "test_debug_34@aetherguard.dev"
r_reg = requests.post(f"{base_url}/auth/register", json={"email": email, "password": "Password123!"})
if r_reg.status_code != 201:
    print(f"Failed to register. {r_reg.text}")
    sys.exit(1)

tokens = r_reg.json()
access_token = tokens["access_token"]

# 2. Get the dashboard summary
r_dash = requests.get(f"{base_url}/dashboard/summary", headers={"Authorization": f"Bearer {access_token}"})
print(f"STATUS CODE: {r_dash.status_code}")
try:
    print(r_dash.json())
except:
    print(r_dash.text)
