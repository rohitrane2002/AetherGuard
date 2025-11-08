# ============================================================
# FILE: backend/main.py
# ============================================================

from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import stripe
import os
from typing import Optional

# ----------------------------
# App setup
# ----------------------------
app = FastAPI(title="AetherGuard API - Subscription Enabled")

# Configure CORS for requests from your Next.js frontend
origins = [
    "https://aetherguard.vercel.app",  # your Vercel site
    "http://localhost:3000",           # local testing
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Stripe configuration (Mock)
# ----------------------------
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")

# Mock Tiers
PRICE_IDS = {
    "free": "price_free_mock",
    "pro": "price_pro_mock",
    "enterprise": "price_enterprise_mock",
}

# ----------------------------
# Mock user subscription DB
# ----------------------------
mock_user_db = {
    "user@example.com": {"plan_id": "free"},
}

def update_user_subscription_status(user_email: str, plan_id: str):
    """Simulate updating user’s plan in a database."""
    mock_user_db[user_email] = {"plan_id": plan_id}
    print(f"[INFO] Updated {user_email} to plan: {plan_id}")

def get_user_plan(email: str) -> str:
    """Quick lookup of user plan."""
    user = mock_user_db.get(email)
    return user["plan_id"] if user else "free"

# ----------------------------
# Stripe Models for frontend calls
# ----------------------------
class CheckoutSessionRequest(BaseModel):
    price_id: str
    customer_email: str


# ----------------------------
# Endpoints
# ----------------------------
@app.post("/create-checkout-session")
async def create_checkout_session(req: CheckoutSessionRequest):
    """Simulate creating a subscription checkout session."""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": req.price_id, "quantity": 1}],
            success_url="https://aetherguard.vercel.app/success",
            cancel_url="https://aetherguard.vercel.app/cancel",
            customer_email=req.customer_email,
        )
        return {"sessionId": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Simulated webhook for subscription updates."""
    payload = await request.body()
    try:
        # Simulate a Stripe webhook event
        event = stripe.Event.construct_from(
            {
                "type": "checkout.session.completed",
                "data": {"object": {"customer_email": "user@example.com", "plan_id": "pro"}},
            },
            stripe.api_key,
        )

        if event.type == "checkout.session.completed":
            session = event.data.object
            email = session.get("customer_email")
            plan_id = session.get("plan_id", "pro")
            update_user_subscription_status(email, plan_id)

        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/predict/failure")
async def predict_failure(user_email: Optional[str] = Header(None)):
    """Example gated endpoint requiring paid subscription."""
    if not user_email:
        raise HTTPException(status_code=401, detail="Missing user email header.")
    plan = get_user_plan(user_email)
    if plan in ["free", "trial"]:
        raise HTTPException(
            status_code=403,
            detail="Subscription Required. Upgrade to Pro/Enterprise to use AetherGuard's predictions."
        )
    return {"forecast": "Mock forecast output", "plan": plan}

# ============================================================