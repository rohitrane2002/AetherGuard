import requests
import sys

base_url = "https://aetherguard-api.onrender.com"
email = "test_debug_27@aetherguard.dev"
r_reg = requests.post(f"{base_url}/auth/register", json={"email": email, "password": "Password123!"})
if r_reg.status_code != 201:
    print(f"Reg failed: {r_reg.text}")
    sys.exit(1)

token = r_reg.json()["access_token"]

# Test /account
r_acc = requests.get(f"{base_url}/account", headers={"Authorization": f"Bearer {token}"})
print(f"/account STATUS: {r_acc.status_code}")
if r_acc.status_code == 200:
    print(r_acc.json())
else:
    print(r_acc.text)

# Test /usage
r_use = requests.get(f"{base_url}/usage", headers={"Authorization": f"Bearer {token}"})
print(f"/usage STATUS: {r_use.status_code}")

# Test /dashboard/summary
r_dash = requests.get(f"{base_url}/dashboard/summary", headers={"Authorization": f"Bearer {token}"})
print(f"/dashboard/summary STATUS: {r_dash.status_code}")
if r_dash.status_code != 200:
    print(r_dash.text)
