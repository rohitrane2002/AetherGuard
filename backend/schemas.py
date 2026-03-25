from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class AccountResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    subscription_plan: str
    subscription_status: str
    stripe_customer_id: Optional[str] = None
    created_at: datetime


class UsageResponse(BaseModel):
    subscription_plan: str
    daily_limit: int
    analyses_today: int
    remaining_today: int


class CheckoutSessionRequest(BaseModel):
    price_id: str


class CheckoutSessionResponse(BaseModel):
    sessionId: str
    customerId: Optional[str]
    priceId: str
    plan: str
    customerEmail: EmailStr
    createdAt: str
    checkoutUrl: Optional[str] = None
    mode: str


class AnalysisHistoryResponse(BaseModel):
    id: int
    contract_snippet: str
    prediction: str
    confidence: float
    timestamp: datetime


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: str


class ChatResponse(BaseModel):
    reply: str
    messages: list[ChatMessageResponse]


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ApiKeyCreateResponse(BaseModel):
    id: int
    name: str
    key: str
    key_prefix: str
    created_at: datetime


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    status: str
    model: dict[str, Any]
    database: dict[str, Any]
