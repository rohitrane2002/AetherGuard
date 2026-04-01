import requests
import sys

base_url = "https://aetherguard-api.onrender.com"

# 1. Register a new user to test fresh
email = "test_debug_35@aetherguard.dev"
r_reg = requests.post(f"{base_url}/auth/register", json={"email": email, "password": "Password123!"})
if r_reg.status_code != 201:
    print(f"Failed to register. {r_reg.text}")
    sys.exit(1)

tokens = r_reg.json()
access_token = tokens["access_token"]

# 2. Test debug endpoint
r_debug = requests.get(f"{base_url}/debug/test", headers={"Authorization": f"Bearer {access_token}"})
print(f"/debug/test STATUS: {r_debug.status_code}")
print(r_debug.text)

# 3. Test dashboard summary
r_dash = requests.get(f"{base_url}/dashboard/summary", headers={"Authorization": f"Bearer {access_token}"})
print(f"/dashboard/summary STATUS: {r_dash.status_code}")
print(r_dash.text)
