# ============================================================
# AetherGuard backend – production‑ready with mock Stripe logic
# ============================================================

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional

# ----------------------------
# App setup
# ----------------------------
app = FastAPI(title="AetherGuard API – Subscription Enabled")

# CORS (frontend domains that may call the API)
origins = [
    "https://aetherguard.vercel.app",  # your deployed frontend
    "http://localhost:3000",           # local dev
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Mock database for user plans
# ----------------------------
mock_user_db = {
    "user@example.com": {"plan_id": "free"},
}

def update_user_subscription_status(user_email: str, plan_id: str):
    """Simulate updating a user's subscription."""
    mock_user_db[user_email] = {"plan_id": plan_id}
    print(f"[INFO] Updated subscription for {user_email} → {plan_id}")

def get_user_plan(email: str) -> str:
    return mock_user_db.get(email, {}).get("plan_id", "free")


# ----------------------------
# Request models
# ----------------------------
class CheckoutSessionRequest(BaseModel):
    price_id: str
    customer_email: str


# ============================================================
# ROUTES
# ============================================================

@app.post("/create-checkout-session")
async def create_checkout_session(req: CheckoutSessionRequest):
    """
    Mock Stripe Checkout Session creator.
    Returns a dummy session ID instead of calling the Stripe API.
    """
    mock_session_id = f"mock_session_{req.price_id}"
    print(f"[MOCK] Created checkout session for {req.customer_email} | plan={req.price_id}")
    update_user_subscription_status(req.customer_email, "pro")  # simulate upgrading user
    return {"sessionId": mock_session_id}


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Mock webhook receiver that simulates Stripe 'checkout.session.completed'.
    """
    payload = await request.body()
    print(f"[MOCK] Webhook received {len(payload)} bytes")
    update_user_subscription_status("user@example.com", "pro")
    return {"status": "success"}


@app.get("/predict/failure")
async def predict_failure(user_email: Optional[str] = Header(None)):
    """Example endpoint gated by subscription tier."""
    if not user_email:
        raise HTTPException(status_code=401, detail="Missing 'user_email' header .")
    user_plan = get_user_plan(user_email)
    if user_plan in ["free", "trial"]:
        raise HTTPException(
            status_code=403,
            detail="Subscription Required – Upgrade to Pro/Enterprise to use AetherGuard's predictions.",
        )
    return {"forecast": "Mocked prediction output.", "plan": user_plan}


@app.get("/")
async def root():
    return {"status": "AetherGuard API running"}


# ============================================================
# END OF FILE
# ============================================================