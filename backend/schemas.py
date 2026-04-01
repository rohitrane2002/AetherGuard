from datetime import datetime
from typing import Any, Optional
import uuid

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
    id: uuid.UUID
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
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    plan: str
    subscription_status: str
    stripe_customer_id: Optional[str] = None
    created_at: datetime


class UsageResponse(BaseModel):
    plan: str
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


class BillingPortalResponse(BaseModel):
    portalUrl: str
    customerId: Optional[str]
    mode: str


class AnalysisHistoryResponse(BaseModel):
    id: int
    contract_snippet: str
    prediction: str
    confidence: float
    timestamp: datetime


class AnalysisFindingResponse(BaseModel):
    slug: str
    label: str
    severity: str
    confidence: float
    summary: str
    recommendation: str


class AnalysisResponse(BaseModel):
    prediction: str
    prob_secure: float
    prob_vulnerable: float
    email: str
    log_id: int
    model_source: str
    confidence: float
    remaining_today: int
    risk_score: int
    findings: list[AnalysisFindingResponse]
    safe_patterns: list[str]
    summary: str
    fix_suggestions: list[str]
    autofix_preview: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: str


class ChatResponse(BaseModel):
    reply: str
    messages: list[ChatMessageResponse]


class NotificationResponse(BaseModel):
    id: int
    title: str
    body: str
    severity: str
    category: str
    is_read: bool
    action_url: Optional[str] = None
    timestamp: str


class DashboardSummaryResponse(BaseModel):
    account: dict[str, Any]
    usage: dict[str, Any]
    recent_scans: list[dict[str, Any]]
    chat_history: list[ChatMessageResponse]
    notifications: list[dict[str, Any]]
    workspace: dict[str, Any]


class WorkspaceInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="member", pattern=r"^(owner|admin|member|viewer)$")


class WorkspaceMemberUpdateRequest(BaseModel):
    role: str = Field(pattern=r"^(admin|member|viewer)$")


class WorkspaceMemberResponse(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    role: str
    status: str
    joined_at: str


class SharedReportResponse(BaseModel):
    id: int
    analysis_log_id: int
    prediction: str
    confidence: float
    risk_score: int
    contract_snippet: str
    shared_at: str


class WorkspaceResponse(BaseModel):
    team_id: int
    team_name: str
    team_slug: str
    role: str
    members: list[WorkspaceMemberResponse]
    shared_reports: list[SharedReportResponse]
    can_manage_members: bool


class WorkspaceInviteResponse(BaseModel):
    invitation_id: int
    email: EmailStr
    role: str
    status: str


class ShareReportRequest(BaseModel):
    analysis_log_id: int


class FixContractRequest(BaseModel):
    content: str = Field(min_length=1, max_length=50000)


class FixContractResponse(BaseModel):
    fixed_code: str
    summary: str
    highlighted_changes: list[str]


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
