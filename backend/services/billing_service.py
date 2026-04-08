from datetime import datetime, timezone
from typing import Any, Optional
from uuid import uuid4

import stripe

from config import settings


PLAN_BY_PRICE_ID = {
    "price_free_mock": "free",
    "price_pro_mock": "pro",
    "price_enterprise_mock": "enterprise",
}
if settings.stripe_price_id_free:
    PLAN_BY_PRICE_ID[settings.stripe_price_id_free] = "free"
if settings.stripe_price_id_pro:
    PLAN_BY_PRICE_ID[settings.stripe_price_id_pro] = "pro"
if settings.stripe_price_id_enterprise:
    PLAN_BY_PRICE_ID[settings.stripe_price_id_enterprise] = "enterprise"

REAL_PRICE_ID_BY_MOCK = {
    "price_free_mock": settings.stripe_price_id_free,
    "price_pro_mock": settings.stripe_price_id_pro,
    "price_enterprise_mock": settings.stripe_price_id_enterprise,
}

PLAN_DAILY_LIMITS = {
    "free": 5,
    "pro": 100,
    "enterprise": 1000000,
    "founder": 1000000000, # Effectively unlimited
}


SUPPORTED_WEBHOOK_EVENTS = {
    "checkout.session.completed",
    "invoice.payment_succeeded",
    "customer.subscription.updated",
    "customer.subscription.deleted",
}

WEBHOOK_STATUS_BY_EVENT = {
    "checkout.session.completed": "active",
    "invoice.payment_succeeded": "active",
    "customer.subscription.updated": "active",
    "customer.subscription.deleted": "cancelled",
}


def get_plan_from_price_id(price_id: Optional[str]) -> str:
    if not price_id:
        return "free"
    return PLAN_BY_PRICE_ID.get(price_id, "free")


def get_daily_limit_for_plan(plan: str) -> int:
    return PLAN_DAILY_LIMITS.get(plan, PLAN_DAILY_LIMITS["free"])


def stripe_is_configured() -> bool:
    return bool(settings.stripe_secret_key)


def configure_stripe() -> None:
    if settings.stripe_secret_key:
        key = settings.stripe_secret_key.strip()
        if "*" in key or "•" in key:
            raise ValueError("It looks like you copied a MASKED Stripe key (with asterisks or dots). Please go to Stripe Dashboard and click 'REVEAL TEST KEY' before copying the full key.")
        stripe.api_key = key


def create_checkout_session(price_id: str, customer_email: str) -> dict:
    plan = get_plan_from_price_id(price_id)
    real_price_id = REAL_PRICE_ID_BY_MOCK.get(price_id, price_id)

    if not stripe_is_configured() or plan == "free" or not real_price_id:
        return {
            "session_id": f"cs_test_{uuid4().hex[:24]}",
            "customer_id": f"cus_{uuid4().hex[:14]}",
            "subscription_id": None,
            "price_id": price_id,
            "plan": plan,
            "customer_email": customer_email,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "checkout_url": None,
            "mode": "mock",
        }

    configure_stripe()
    session = stripe.checkout.Session.create(
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{"price": real_price_id, "quantity": 1}],
        customer_email=customer_email,
        success_url=settings.stripe_success_url,
        cancel_url=settings.stripe_cancel_url,
        metadata={
            "customer_email": customer_email,
            "price_id": real_price_id,
            "plan": plan,
        },
    )
    return {
        "session_id": session.id,
        "customer_id": session.customer,
        "subscription_id": session.subscription,
        "price_id": real_price_id,
        "plan": plan,
        "customer_email": customer_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "checkout_url": session.url,
        "mode": "stripe",
    }


def create_billing_portal_session(customer_id: Optional[str], customer_email: str) -> dict:
    if not stripe_is_configured():
        return {
            "portal_url": settings.stripe_billing_portal_return_url,
            "customer_id": customer_id or f"cus_{uuid4().hex[:14]}",
            "mode": "mock",
        }

    configure_stripe()
    resolved_customer_id = customer_id
    if not resolved_customer_id:
        customers = stripe.Customer.list(email=customer_email, limit=1)
        if customers.data:
            resolved_customer_id = customers.data[0].id
    if not resolved_customer_id:
        customer = stripe.Customer.create(email=customer_email)
        resolved_customer_id = customer.id

    session = stripe.billing_portal.Session.create(
        customer=resolved_customer_id,
        return_url=settings.stripe_billing_portal_return_url,
    )
    return {
        "portal_url": session.url,
        "customer_id": resolved_customer_id,
        "mode": "stripe",
    }


def parse_webhook(payload: bytes, signature: Optional[str]) -> dict:
    if not stripe_is_configured() or not settings.stripe_webhook_secret:
        raise ValueError("Stripe webhook verification is not configured")
    configure_stripe()
    return stripe.Webhook.construct_event(
        payload=payload, 
        sig_header=signature, 
        secret=settings.stripe_webhook_secret.strip()
    )


def _epoch_to_datetime(value: Optional[int]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromtimestamp(value, tz=timezone.utc)


def _extract_price_id(obj: dict[str, Any]) -> Optional[str]:
    if obj.get("metadata", {}).get("price_id"):
        return obj["metadata"]["price_id"]

    if obj.get("items", {}).get("data"):
        item = obj["items"]["data"][0]
        price = item.get("price") or {}
        return price.get("id")

    if obj.get("lines", {}).get("data"):
        line = obj["lines"]["data"][0]
        price = line.get("price") or {}
        return price.get("id")

    return None


def extract_webhook_details(event: dict[str, Any]) -> dict[str, Any]:
    event_type = event.get("type")
    obj = event.get("data", {}).get("object", {}) or {}
    metadata = obj.get("metadata", {}) or {}
    subscription_details = obj.get("subscription_details", {}) or {}

    price_id = (
        metadata.get("price_id")
        or subscription_details.get("metadata", {}).get("price_id")
        or _extract_price_id(obj)
    )
    customer_email = (
        metadata.get("customer_email")
        or obj.get("customer_email")
        or obj.get("customer_details", {}).get("email")
    )
    customer_id = obj.get("customer")
    subscription_id = obj.get("subscription")
    if event_type == "customer.subscription.deleted":
        subscription_id = obj.get("id")

    current_period_end = _epoch_to_datetime(obj.get("current_period_end"))
    if current_period_end is None and obj.get("lines", {}).get("data"):
        line = obj["lines"]["data"][0]
        current_period_end = _epoch_to_datetime(line.get("period", {}).get("end"))

    plan = get_plan_from_price_id(price_id)
    if event_type == "customer.subscription.deleted":
        plan = "free"

    return {
        "event_type": event_type,
        "supported": event_type in SUPPORTED_WEBHOOK_EVENTS,
        "customer_email": customer_email,
        "customer_id": customer_id,
        "subscription_id": subscription_id,
        "price_id": price_id,
        "plan": plan,
        "status": WEBHOOK_STATUS_BY_EVENT.get(event_type, "active"),
        "current_period_end": current_period_end,
    }
